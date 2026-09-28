import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/server/config/db';
import { LeadsService } from '@/server/services/leads.service';
import { LeadsQuerySchema } from '@/server/validators/leads.validator';

const leadsService = new LeadsService();

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const rawQuery = Object.fromEntries(searchParams.entries());

  const parsed = LeadsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid query parameters provided',
        errors: parsed.error.format(),
      },
      { status: 400, headers: PRIVATE_HEADERS }
    );
  }

  try {
    await connectToDatabase();
  } catch (err: any) {
    const isMissingConfig = err?.message?.includes('MONGODB_URI');
    return NextResponse.json(
      {
        success: false,
        code: isMissingConfig ? 'CONFIGURATION_ERROR' : 'DATABASE_ERROR',
        message: isMissingConfig
          ? 'Database configuration is not set up yet. Please check MONGODB_URI in environment variables.'
          : 'Unable to connect to the database. Please try again shortly.',
      },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  try {
    const data = await leadsService.getLeads(parsed.data);
    return NextResponse.json({ success: true, data }, { status: 200, headers: PRIVATE_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while retrieving lead records. Please try again later.',
      },
      { status: 500, headers: PRIVATE_HEADERS }
    );
  }
}
