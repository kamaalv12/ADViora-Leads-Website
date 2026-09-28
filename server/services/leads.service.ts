import mongoose from 'mongoose';
import { z } from 'zod';
import { User, ServiceEnquiry, UtmCampaign } from '@/server/models';
import { LeadsQuerySchema, LeadDetailQuerySchema } from '@/server/validators/leads.validator';
import { getDateRangeBounds } from '@/server/utils/timezone';
import { maskPhoneNumber } from '@/server/utils/csv';
import {
  ATTRIBUTION_EVIDENCE_FIELDS,
  DB_QUERY_TIMEOUT_MS,
  MAX_CSV_EXPORT_LIMIT,
} from '@/lib/constants';
import {
  LeadsListResponse,
  LeadDetailResponse,
  FilterOptionsResponse,
  LatestAttributionSummary,
  LeadTableRow,
} from '@/lib/types';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Builds the MongoDB $or query for fields that constitute attribution evidence.
 */
function buildAttributionEvidenceMatch(): any {
  return {
    $or: ATTRIBUTION_EVIDENCE_FIELDS.map((field) => ({
      [field]: { $exists: true, $nin: ['', null] },
    })),
  };
}

export class LeadsService {
  /**
   * Fetches paginated unique leads and active-cohort metrics with server-side filters.
   */
  async getLeads(query: z.infer<typeof LeadsQuerySchema>): Promise<LeadsListResponse['data']> {
    const {
      range,
      startDate,
      endDate,
      search,
      interest,
      attribution,
      utm_source,
      utm_medium,
      utm_campaign,
      sort,
      page,
      limit,
    } = query;

    const skip = (page - 1) * limit;
    const { start, end, isAllTime, label: activeRangeLabel } = getDateRangeBounds(
      range,
      startDate,
      endDate
    );

    // 1. Initial Match on service_enquiries (Period & Interest)
    const enquiryMatch: any = {};
    if (!isAllTime && start && end) {
      enquiryMatch.createdAt = { $gte: start, $lt: end };
    }
    if (interest !== 'all') {
      enquiryMatch.interest = interest;
    }

    // 2. Base Pipeline up to User Join
    const basePipeline: any[] = [
      { $match: enquiryMatch },
      // Sort oldest-first so $last in group picks the true latest enquiry for this user
      { $sort: { createdAt: 1, _id: 1 } },
      {
        $group: {
          _id: '$userId',
          firstEnquiryDate: { $first: '$createdAt' },
          latestEnquiryDate: { $last: '$createdAt' },
          inPeriodEnquiries: { $sum: 1 },
          latestInterest: { $last: '$interest' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ];

    // 3. Search Filter across Name, Email, and Phone
    if (search && search.trim().length > 0) {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, 'i');
      basePipeline.push({
        $match: {
          $or: [
            { 'user.name': searchRegex },
            { 'user.email': searchRegex },
            { 'user.phone': searchRegex },
          ],
        },
      });
    }

    // 4. Combined Same-Touchpoint Campaign Filters
    // Checks if the user has AT LEAST ONE touchpoint matching all specified campaign params
    if (utm_source || utm_medium || utm_campaign) {
      const sameTouchpointMatch: any = {
        $expr: { $eq: ['$userId', '$$uid'] },
      };
      if (utm_source) sameTouchpointMatch.utm_source = utm_source;
      if (utm_medium) sameTouchpointMatch.utm_medium = utm_medium;
      if (utm_campaign) sameTouchpointMatch.utm_campaign = utm_campaign;

      basePipeline.push(
        {
          $lookup: {
            from: 'utm_campaigns',
            let: { uid: '$_id' },
            pipeline: [
              { $match: sameTouchpointMatch },
              { $limit: 1 },
              { $project: { _id: 1 } },
            ],
            as: 'matchedCampaignTouchpoint',
          },
        },
        {
          $match: {
            matchedCampaignTouchpoint: { $ne: [] },
          },
        }
      );
    }

    // 5. Attribution Status Filter (Attributed vs Unattributed)
    if (attribution === 'attributed') {
      basePipeline.push(
        {
          $lookup: {
            from: 'utm_campaigns',
            let: { uid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', '$$uid'] },
                  ...buildAttributionEvidenceMatch(),
                },
              },
              { $limit: 1 },
              { $project: { _id: 1 } },
            ],
            as: 'hasAttributionEvidence',
          },
        },
        {
          $match: {
            hasAttributionEvidence: { $ne: [] },
          },
        }
      );
    } else if (attribution === 'unattributed') {
      basePipeline.push(
        {
          $lookup: {
            from: 'utm_campaigns',
            let: { uid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', '$$uid'] },
                  ...buildAttributionEvidenceMatch(),
                },
              },
              { $limit: 1 },
              { $project: { _id: 1 } },
            ],
            as: 'hasAttributionEvidence',
          },
        },
        {
          $match: {
            hasAttributionEvidence: { $eq: [] },
          },
        }
      );
    }

    // 6. Facet for Active-Cohort Metrics and Paginated Rows
    const sortStage =
      sort === 'oldest'
        ? { $sort: { latestEnquiryDate: 1 as const, _id: 1 as const } }
        : { $sort: { latestEnquiryDate: -1 as const, _id: -1 as const } };

    const facetPipeline: any[] = [
      ...basePipeline,
      {
        $facet: {
          metrics: [
            {
              $group: {
                _id: null,
                uniqueLeads: { $sum: 1 },
                totalEnquiries: { $sum: '$inPeriodEnquiries' },
                newLeads: {
                  $sum: {
                    $cond: [
                      !isAllTime && start && end
                        ? {
                            $and: [
                              { $gte: ['$user.createdAt', start] },
                              { $lt: ['$user.createdAt', end] },
                            ],
                          }
                        : false,
                      1,
                      0,
                    ],
                  },
                },
                returningLeads: {
                  $sum: {
                    $cond: [
                      !isAllTime && start
                        ? { $lt: ['$user.createdAt', start] }
                        : false,
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          pagedRows: [
            sortStage,
            { $skip: skip },
            { $limit: limit },
            // Correlated lookup to fetch ONLY the single newest touchpoint with attribution evidence
            {
              $lookup: {
                from: 'utm_campaigns',
                let: { uid: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$userId', '$$uid'] },
                      ...buildAttributionEvidenceMatch(),
                    },
                  },
                  { $sort: { createdAt: -1, _id: -1 } },
                  { $limit: 1 },
                  {
                    $project: {
                      utm_source: 1,
                      utm_medium: 1,
                      utm_campaign: 1,
                      utm_content: 1,
                      utm_term: 1,
                      gclid: 1,
                      fbclid: 1,
                      fbc: 1,
                      platform: 1,
                      createdAt: 1,
                    },
                  },
                ],
                as: 'latestTrackedTouchpoint',
              },
            },
            // Correlated lookup for total lifetime enquiries count
            {
              $lookup: {
                from: 'service_enquiries',
                let: { uid: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$userId', '$$uid'] } } },
                  { $count: 'count' },
                ],
                as: 'totalEnquiriesMeta',
              },
            },
            // Correlated lookup for total lifetime touchpoints count
            {
              $lookup: {
                from: 'utm_campaigns',
                let: { uid: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$userId', '$$uid'] } } },
                  { $count: 'count' },
                ],
                as: 'totalTouchpointsMeta',
              },
            },
          ],
        },
      },
    ];

    const result = await ServiceEnquiry.aggregate(facetPipeline)
      .option({ maxTimeMS: DB_QUERY_TIMEOUT_MS })
      .exec();

    const metricsDoc = result[0]?.metrics[0] || {
      uniqueLeads: 0,
      totalEnquiries: 0,
      newLeads: 0,
      returningLeads: 0,
    };

    const total = metricsDoc.uniqueLeads || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const leads: LeadTableRow[] = (result[0]?.pagedRows || []).map(
      (row: any, index: number) => {
        const tracked = row.latestTrackedTouchpoint?.[0];
        let primaryAttribution: LatestAttributionSummary;

        if (tracked) {
          let badge = 'Attributed';
          if (tracked.utm_source && tracked.utm_medium) {
            badge = `${tracked.utm_source} / ${tracked.utm_medium}`;
          } else if (tracked.utm_source) {
            badge = tracked.utm_source;
          } else if (tracked.gclid) {
            badge = 'Google Click ID';
          } else if (tracked.fbclid || tracked.fbc) {
            badge = 'Meta Click ID';
          } else if (tracked.platform) {
            badge = tracked.platform;
          } else if (tracked.utm_content) {
            badge = `Content: ${tracked.utm_content}`;
          } else if (tracked.utm_term) {
            badge = `Term: ${tracked.utm_term}`;
          }

          primaryAttribution = {
            status: 'attributed',
            source: tracked.utm_source,
            medium: tracked.utm_medium,
            campaign: tracked.utm_campaign,
            badgeLabel: badge,
            timestamp: tracked.createdAt ? tracked.createdAt.toISOString() : undefined,
          };
        } else {
          primaryAttribution = {
            status: 'unattributed',
            badgeLabel: 'Unattributed',
          };
        }

        const phone = row.user.phone || '';
        const countryCode = row.user.countryCode || '+91';

        return {
          serialNumber: skip + index + 1,
          userId: row._id.toString(),
          name: row.user.name || 'Anonymous',
          phone: phone ? `${countryCode} ${phone}` : '—',
          maskedPhone: maskPhoneNumber(phone, countryCode),
          email: row.user.email || '—',
          latestInterest: row.latestInterest || '—',
          firstEnquiryDate: row.firstEnquiryDate ? row.firstEnquiryDate.toISOString() : '',
          latestEnquiryDate: row.latestEnquiryDate ? row.latestEnquiryDate.toISOString() : '',
          totalEnquiries: row.totalEnquiriesMeta?.[0]?.count || row.inPeriodEnquiries || 1,
          totalTouchpoints: row.totalTouchpointsMeta?.[0]?.count || 0,
          primaryAttribution,
        };
      }
    );

    return {
      metrics: {
        uniqueLeads: metricsDoc.uniqueLeads || 0,
        totalEnquiries: metricsDoc.totalEnquiries || 0,
        newLeads: metricsDoc.newLeads || 0,
        returningLeads: isAllTime ? 'N/A' : (metricsDoc.returningLeads || 0),
        activeRangeLabel,
      },
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Fetches single lead full profile, with independently paginated enquiry and touchpoint histories.
   */
  async getLeadDetail(
    userIdStr: string,
    query: z.infer<typeof LeadDetailQuerySchema>
  ): Promise<LeadDetailResponse['data'] | null> {
    if (!mongoose.Types.ObjectId.isValid(userIdStr)) {
      return null;
    }

    const userId = new mongoose.Types.ObjectId(userIdStr);

    // 1. Fetch Allowlisted User Details
    const user = await User.findById(userId)
      .select('_id name email phone countryCode timezone status createdAt')
      .maxTimeMS(DB_QUERY_TIMEOUT_MS)
      .lean();

    if (!user) {
      return null;
    }

    const { enquiriesPage, enquiriesLimit, touchpointsPage, touchpointsLimit } = query;
    const enquiriesSkip = (enquiriesPage - 1) * enquiriesLimit;
    const touchpointsSkip = (touchpointsPage - 1) * touchpointsLimit;

    // 2. Fetch Paged Enquiries & Touchpoints in Parallel
    const [
      enquiriesTotal,
      enquiriesDocs,
      touchpointsTotal,
      touchpointsDocs,
    ] = await Promise.all([
      ServiceEnquiry.countDocuments({ userId }).maxTimeMS(DB_QUERY_TIMEOUT_MS),
      ServiceEnquiry.find({ userId })
        .sort({ createdAt: -1, _id: -1 })
        .skip(enquiriesSkip)
        .limit(enquiriesLimit)
        .select('_id interest message createdAt')
        .maxTimeMS(DB_QUERY_TIMEOUT_MS)
        .lean(),
      UtmCampaign.countDocuments({ userId }).maxTimeMS(DB_QUERY_TIMEOUT_MS),
      UtmCampaign.find({ userId })
        .sort({ createdAt: -1, _id: -1 })
        .skip(touchpointsSkip)
        .limit(touchpointsLimit)
        .select(
          '_id route utm_source utm_medium utm_campaign utm_content utm_term platform gclid fbclid fbp fbc matchtype network device keyword placement campaignid adgroupid createdAt'
        )
        .maxTimeMS(DB_QUERY_TIMEOUT_MS)
        .lean(),
    ]);

    const enquiries = enquiriesDocs.map((e: any) => ({
      _id: e._id.toString(),
      interest: e.interest,
      message: e.message || '',
      createdAt: e.createdAt ? e.createdAt.toISOString() : '',
    }));

    const touchpoints = touchpointsDocs.map((t: any) => {
      // Determine if touchpoint has attribution evidence
      const hasAttributionEvidence = ATTRIBUTION_EVIDENCE_FIELDS.some(
        (field) => t[field] && typeof t[field] === 'string' && t[field].trim().length > 0
      );

      return {
        _id: t._id.toString(),
        route: t.route || undefined,
        utm_source: t.utm_source || undefined,
        utm_medium: t.utm_medium || undefined,
        utm_campaign: t.utm_campaign || undefined,
        utm_content: t.utm_content || undefined,
        utm_term: t.utm_term || undefined,
        platform: t.platform || undefined,
        gclid: t.gclid || undefined,
        fbclid: t.fbclid || undefined,
        fbp: t.fbp || undefined,
        fbc: t.fbc || undefined,
        matchtype: t.matchtype || undefined,
        network: t.network || undefined,
        device: t.device || undefined,
        keyword: t.keyword || undefined,
        placement: t.placement || undefined,
        campaignid: t.campaignid || undefined,
        adgroupid: t.adgroupid || undefined,
        hasAttributionEvidence,
        createdAt: t.createdAt ? t.createdAt.toISOString() : '',
      };
    });

    return {
      user: {
        _id: (user as any)._id.toString(),
        name: (user as any).name,
        email: (user as any).email,
        phone: (user as any).phone,
        countryCode: (user as any).countryCode || '+91',
        timezone: (user as any).timezone || 'Asia/Kolkata',
        status: (user as any).status || 'ACTIVE',
        createdAt: (user as any).createdAt ? (user as any).createdAt.toISOString() : '',
      },
      enquiries: {
        items: enquiries,
        total: enquiriesTotal,
        page: enquiriesPage,
        limit: enquiriesLimit,
        totalPages: Math.ceil(enquiriesTotal / enquiriesLimit) || 1,
      },
      touchpoints: {
        items: touchpoints,
        total: touchpointsTotal,
        page: touchpointsPage,
        limit: touchpointsLimit,
        totalPages: Math.ceil(touchpointsTotal / touchpointsLimit) || 1,
      },
    };
  }

  /**
   * Returns top 100 filter options for sources, mediums, and campaigns, plus digital interests.
   */
  async getFilterOptions(): Promise<FilterOptionsResponse['data']> {
    const [rawSources, rawMediums, rawCampaigns] = await Promise.all([
      UtmCampaign.distinct('utm_source', { utm_source: { $exists: true, $nin: ['', null] } }).maxTimeMS(DB_QUERY_TIMEOUT_MS),
      UtmCampaign.distinct('utm_medium', { utm_medium: { $exists: true, $nin: ['', null] } }).maxTimeMS(DB_QUERY_TIMEOUT_MS),
      UtmCampaign.distinct('utm_campaign', { utm_campaign: { $exists: true, $nin: ['', null] } }).maxTimeMS(DB_QUERY_TIMEOUT_MS),
    ]);

    const sources = rawSources.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).sort();
    const mediums = rawMediums.filter((m): m is string => typeof m === 'string' && m.trim().length > 0).sort();
    const campaigns = rawCampaigns.filter((c): c is string => typeof c === 'string' && c.trim().length > 0).sort();

    return {
      interests: [
        'Business transformation',
        'ITSM / AI / digital transformation',
        'Professional training',
      ],
      sources: sources.slice(0, 100),
      mediums: mediums.slice(0, 100),
      campaigns: campaigns.slice(0, 100),
      truncated: {
        sources: sources.length > 100,
        mediums: mediums.length > 100,
        campaigns: campaigns.length > 100,
      },
    };
  }

  /**
   * Searchable filter endpoint for long-tail campaigns, sources, or mediums.
   */
  async searchFilterField(field: 'utm_source' | 'utm_medium' | 'utm_campaign', query?: string): Promise<string[]> {
    const filter: any = {
      [field]: { $exists: true, $nin: ['', null] },
    };

    if (query && query.trim().length > 0) {
      filter[field] = { $regex: new RegExp(escapeRegex(query.trim()), 'i') };
    }

    const values = await UtmCampaign.distinct(field, filter).maxTimeMS(DB_QUERY_TIMEOUT_MS);
    return values
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .slice(0, 50)
      .sort();
  }

  /**
   * Fetches active filtered leads for CSV export (capped at MAX_CSV_EXPORT_LIMIT = 1000).
   */
  async getLeadsForExport(query: z.infer<typeof LeadsQuerySchema>) {
    // Override limit to MAX_CSV_EXPORT_LIMIT
    const exportQuery = { ...query, page: 1, limit: MAX_CSV_EXPORT_LIMIT };
    const { metrics, leads } = await this.getLeads(exportQuery);

    return {
      totalMatched: metrics.uniqueLeads,
      exportedCount: leads.length,
      isTruncated: metrics.uniqueLeads > MAX_CSV_EXPORT_LIMIT,
      leads,
    };
  }
}
