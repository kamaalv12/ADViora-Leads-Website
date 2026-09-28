import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/server/config/db';
import { LeadsService } from '@/server/services/leads.service';
import { FiltersSearchSchema } from '@/server/validators/leads.validator';

const leadsService = new LeadsService();

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const field = searchParams.get('field');
  const q = searchParams.get('q') || undefined;

  const parsed = FiltersSearchSchema.safeParse({ field, q });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: 'Invalid search parameters', errors: parsed.error.format() },
      { status: 400, headers: PRIVATE_HEADERS }
    );
  }

  try {
    await connectToDatabase();
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Database is temporarily unavailable.' },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  try {
    const data = await leadsService.searchFilterField(parsed.data.field, parsed.data.q);
    return NextResponse.json({ success: true, data }, { status: 200, headers: PRIVATE_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Search failed.' },
      { status: 500, headers: PRIVATE_HEADERS }
    );
  }
}
