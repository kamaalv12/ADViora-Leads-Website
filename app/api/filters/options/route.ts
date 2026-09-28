import { NextResponse } from 'next/server';
import connectToDatabase from '@/server/config/db';
import { LeadsService } from '@/server/services/leads.service';

const leadsService = new LeadsService();

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET() {
  try {
    await connectToDatabase();
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Database is temporarily unavailable.' },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  try {
    const data = await leadsService.getFilterOptions();
    return NextResponse.json({ success: true, data }, { status: 200, headers: PRIVATE_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve filter options.' },
      { status: 500, headers: PRIVATE_HEADERS }
    );
  }
}
