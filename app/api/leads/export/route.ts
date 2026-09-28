import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/server/config/db';
import { LeadsService } from '@/server/services/leads.service';
import { LeadsQuerySchema } from '@/server/validators/leads.validator';
import { buildCsvDocument } from '@/server/utils/csv';
import { formatISTDateTime } from '@/server/utils/timezone';

const leadsService = new LeadsService();

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const rawQuery = Object.fromEntries(searchParams.entries());

  // Force limit for schema parse
  rawQuery.limit = rawQuery.limit || '100';

  const parsed = LeadsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid query parameters for export',
        errors: parsed.error.format(),
      },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Database is temporarily unavailable for export.' },
      { status: 503 }
    );
  }

  try {
    const { totalMatched, exportedCount, isTruncated, leads } =
      await leadsService.getLeadsForExport(parsed.data);

    const headers = [
      'S.No',
      'Name',
      'Phone',
      'Email',
      'Latest Service Interest',
      'First Enquiry Date (IST)',
      'Latest Enquiry Date (IST)',
      'Total Enquiries',
      'Attribution Status',
      'Latest UTM Source',
      'Latest UTM Medium',
      'Latest UTM Campaign',
    ];

    const rows = leads.map((lead, idx) => [
      idx + 1,
      lead.name,
      lead.phone,
      lead.email,
      lead.latestInterest,
      formatISTDateTime(lead.firstEnquiryDate),
      formatISTDateTime(lead.latestEnquiryDate),
      lead.totalEnquiries,
      lead.primaryAttribution.badgeLabel,
      lead.primaryAttribution.source || '',
      lead.primaryAttribution.medium || '',
      lead.primaryAttribution.campaign || '',
    ]);

    const csvContent = buildCsvDocument(headers, rows);
    const filenameDate = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="adviora-leads-${filenameDate}.csv"`,
        'X-Export-Total-Matched': String(totalMatched),
        'X-Export-Rows-Returned': String(exportedCount),
        'X-Export-Truncated': String(isTruncated),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'An error occurred while generating the CSV export.' },
      { status: 500 }
    );
  }
}
