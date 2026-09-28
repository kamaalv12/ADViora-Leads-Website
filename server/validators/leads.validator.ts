import { z } from 'zod';
import { ALLOWED_DIGITAL_INTERESTS, ALLOWED_PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/lib/constants';

export const LeadsQuerySchema = z
  .object({
    range: z.enum(['today', '7days', 'all', 'custom']).default('7days'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().trim().max(100).optional(),
    interest: z.enum(['all', ...ALLOWED_DIGITAL_INTERESTS]).default('all'),
    attribution: z.enum(['all', 'attributed', 'unattributed']).default('all'),
    utm_source: z.string().trim().max(100).optional(),
    utm_medium: z.string().trim().max(100).optional(),
    utm_campaign: z.string().trim().max(100).optional(),
    sort: z.enum(['latest', 'oldest']).default('latest'),
    page: z
      .string()
      .regex(/^\d+$/)
      .default('1')
      .transform(Number)
      .refine((n) => n >= 1, 'Page must be >= 1'),
    limit: z
      .string()
      .regex(/^\d+$/)
      .default(String(DEFAULT_PAGE_SIZE))
      .transform(Number)
      .refine(
        (n) => (ALLOWED_PAGE_SIZES as readonly number[]).includes(n),
        `Limit must be one of: ${ALLOWED_PAGE_SIZES.join(', ')}`
      ),
  })
  .refine(
    (data) => {
      if (data.range === 'custom') {
        return !!data.startDate && !!data.endDate;
      }
      return true;
    },
    {
      message: "startDate and endDate are required when range is 'custom'",
      path: ['range'],
    }
  );

export const LeadDetailParamsSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid lead identifier format'),
});

export const LeadDetailQuerySchema = z.object({
  enquiriesPage: z
    .string()
    .regex(/^\d+$/)
    .default('1')
    .transform(Number)
    .refine((n) => n >= 1),
  enquiriesLimit: z
    .string()
    .regex(/^\d+$/)
    .default('10')
    .transform(Number)
    .refine((n) => n >= 1 && n <= 50),
  touchpointsPage: z
    .string()
    .regex(/^\d+$/)
    .default('1')
    .transform(Number)
    .refine((n) => n >= 1),
  touchpointsLimit: z
    .string()
    .regex(/^\d+$/)
    .default('10')
    .transform(Number)
    .refine((n) => n >= 1 && n <= 50),
});

export const FiltersSearchSchema = z.object({
  field: z.enum(['utm_source', 'utm_medium', 'utm_campaign']),
  q: z.string().trim().max(50).optional(),
});
