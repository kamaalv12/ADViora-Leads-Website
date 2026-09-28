'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import DateRangeBar from '@/components/DateRangeBar';
import MetricCards from '@/components/MetricCards';
import FilterBar from '@/components/FilterBar';
import LeadTable from '@/components/LeadTable';
import Pagination from '@/components/Pagination';
import LeadDetailDrawer from '@/components/LeadDetailDrawer';
import TruncationBanner from '@/components/TruncationBanner';
import {
  DateRangePreset,
  AttributionFilter,
  SortOrder,
  DashboardMetrics,
  LeadTableRow,
  PaginationMeta,
  FilterOptionsResponse,
} from '@/lib/types';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

export default function LeadsDashboard() {
  // Query Filters State
  const [range, setRange] = useState<DateRangePreset>('7days');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [interest, setInterest] = useState<string>('all');
  const [attribution, setAttribution] = useState<AttributionFilter>('all');
  const [utmSource, setUtmSource] = useState<string>('');
  const [utmMedium, setUtmMedium] = useState<string>('');
  const [utmCampaign, setUtmCampaign] = useState<string>('');
  const [sort, setSort] = useState<SortOrder>('latest');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE);

  // Data & View State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [leads, setLeads] = useState<LeadTableRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse['data']>({
    interests: [],
    sources: [],
    mediums: [],
    campaigns: [],
    truncated: { sources: false, mediums: false, campaigns: false },
  });

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // AbortController ref to ignore stale responses
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch Filter Options once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      try {
        const res = await fetch('/api/filters/options');
        const json = await res.json();
        if (isMounted && res.ok && json.success) {
          setFilterOptions(json.data);
        }
      } catch {
        // Soft failure for options dropdowns
      }
    };
    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  // Trigger fetch when any query parameter or refreshCounter changes
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function load() {
      try {
        const params = new URLSearchParams({
          range,
          page: String(page),
          limit: String(limit),
          sort,
          interest,
          attribution,
        });

        if (range === 'custom' && startDate && endDate) {
          params.set('startDate', startDate);
          params.set('endDate', endDate);
        }
        if (search) params.set('search', search);
        if (utmSource) params.set('utm_source', utmSource);
        if (utmMedium) params.set('utm_medium', utmMedium);
        if (utmCampaign) params.set('utm_campaign', utmCampaign);

        const res = await fetch(`/api/leads?${params.toString()}`, {
          signal: controller.signal,
        });

        const json = await res.json();

        if (!ignore && res.ok && json.success) {
          setMetrics(json.data.metrics);
          setLeads(json.data.leads);
          setPagination(json.data.pagination);
          setLastUpdated(
            new Date().toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata',
            }) + ' IST'
          );
        } else if (!ignore) {
          setError(json.message || 'Unable to retrieve leads from database');
        }
      } catch (err: any) {
        if (!ignore && err.name !== 'AbortError') {
          setError('Network error: Unable to connect to lead service');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [range, startDate, endDate, search, interest, attribution, utmSource, utmMedium, utmCampaign, sort, page, limit, refreshCounter]);

  // Handlers
  const handleRangeChange = (newRange: DateRangePreset, start?: string, end?: string) => {
    setRange(newRange);
    if (newRange === 'custom') {
      setStartDate(start || '');
      setEndDate(end || '');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setInterest('all');
    setAttribution('all');
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setSort('latest');
    setPage(1);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        range,
        sort,
        interest,
        attribution,
      });

      if (range === 'custom' && startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }
      if (search) params.set('search', search);
      if (utmSource) params.set('utm_source', utmSource);
      if (utmMedium) params.set('utm_medium', utmMedium);
      if (utmCampaign) params.set('utm_campaign', utmCampaign);

      const res = await fetch(`/api/leads/export?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        alert(json?.message || 'Export failed. Please try again.');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adviora-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('An error occurred while downloading the export.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <Header
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          setRefreshCounter((c) => c + 1);
        }}
      />

      <main className="dashboard-container">
        {error && (
          <div className="alert-banner error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                setRefreshCounter((c) => c + 1);
              }}
              style={{
                marginLeft: 'auto',
                background: '#991b1b',
                color: '#fff',
                border: 'none',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        <DateRangeBar
          range={range}
          startDate={startDate}
          endDate={endDate}
          onRangeChange={handleRangeChange}
        />

        <MetricCards metrics={metrics} loading={loading} />

        <TruncationBanner totalMatched={pagination.total} />

        <FilterBar
          search={search}
          interest={interest}
          attribution={attribution}
          utmSource={utmSource}
          utmMedium={utmMedium}
          utmCampaign={utmCampaign}
          sort={sort}
          sources={filterOptions.sources}
          mediums={filterOptions.mediums}
          campaigns={filterOptions.campaigns}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onInterestChange={(v) => {
            setInterest(v);
            setPage(1);
          }}
          onAttributionChange={(v) => {
            setAttribution(v);
            setPage(1);
          }}
          onUtmSourceChange={(v) => {
            setUtmSource(v);
            setPage(1);
          }}
          onUtmMediumChange={(v) => {
            setUtmMedium(v);
            setPage(1);
          }}
          onUtmCampaignChange={(v) => {
            setUtmCampaign(v);
            setPage(1);
          }}
          onSortChange={(v) => {
            setSort(v);
            setPage(1);
          }}
          onClearFilters={handleClearFilters}
          onExportCsv={handleExportCsv}
          exporting={exporting}
          totalMatched={pagination.total}
        />

        <LeadTable
          leads={leads}
          loading={loading}
          onSelectLead={(id) => setSelectedLeadId(id)}
        />

        <Pagination
          pagination={pagination}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />

        <LeadDetailDrawer
          userId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      </main>
    </div>
  );
}
