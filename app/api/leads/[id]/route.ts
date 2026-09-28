import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/server/config/db';
import { LeadsService } from '@/server/services/leads.service';
import {
  LeadDetailParamsSchema,
  LeadDetailQuerySchema,
} from '@/server/validators/leads.validator';

const leadsService = new LeadsService();

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const paramParsed = LeadDetailParamsSchema.safeParse({ id });
  if (!paramParsed.success) {
    return NextResponse.json(
      { success: false, message: 'Invalid lead identifier format' },
      { status: 400, headers: PRIVATE_HEADERS }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const rawQuery = Object.fromEntries(searchParams.entries());

  const queryParsed = LeadDetailQuerySchema.safeParse(rawQuery);
  if (!queryParsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid pagination parameters for lead details',
        errors: queryParsed.error.format(),
      },
      { status: 400, headers: PRIVATE_HEADERS }
    );
  }

  try {
    await connectToDatabase();
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to the database. Please try again shortly.',
      },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  try {
    const data = await leadsService.getLeadDetail(paramParsed.data.id, queryParsed.data);
    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Lead record not found' },
        { status: 404, headers: PRIVATE_HEADERS }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200, headers: PRIVATE_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while fetching lead details.',
      },
      { status: 500, headers: PRIVATE_HEADERS }
    );
  }
}
