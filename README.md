# ADViora-Leads-Website

Dedicated, private read-only operations dashboard for ADViora Consulting to view, analyze, and export lead service enquiries and multi-touch marketing attribution.

Matches the standard C2C lead dashboard architecture used across JIB Solar and Noble Care 4 U.

## Architecture & Database Collections

The dashboard connects server-side in read-only mode to the ADViora MongoDB database (`adviora_prod`):

- **`users`**: Lead contact demographics deduplicated by normalized 10-digit Indian phone number (`name`, `email`, `phone`, `countryCode`, `timezone`, `status`, `createdAt`, `updatedAt`).
- **`service_enquiries`**: Individual service enquiries (`userId`, `interest`: `Business transformation` | `ITSM / AI / digital transformation` | `Professional training`, `message`, `createdAt`, `updatedAt`).
- **`utm_campaigns`**: Multi-touch marketing touchpoints (`userId`, `route`, 17 tracking fields, `createdAt`, `updatedAt`).

> **Attribution Notice**: The database schema links `service_enquiries` and `utm_campaigns` exclusively through `userId`. The dashboard displays individual enquiries alongside the lead's lifetime touchpoint history, without inventing an artificial 1:1 attribution binding.

## Privacy, Discovery, & Access Control

- **Robots Disallow**: Restrictive [`app/robots.ts`](file:///Users/Ishant/Downloads/Dev-Clapingo/ADViora-Leads%20Dashboard/app/robots.ts) disallows all web crawlers (`User-agent: *`, `Disallow: /`).
- **No-Index Metadata**: All pages include `noindex, nofollow, noarchive` metadata directives.
- **Privacy Phone Masking**: Phone numbers are masked in overview tables (`+91 98XXX XX210`) for visual privacy, with full unmasked phone numbers visible inside the individual Lead Detail drawer.
- **Mandatory Hosting Protection**: Because the dashboard contains customer lead data, hosting-level protection (e.g. Vercel Password Protection / Deployment Protection) must be enabled on the Vercel project dashboard before production deployment.
- **No Telemetry**: `clientIp` and `userAgent` are never queried, rendered, or exported.

## Environment Variables

Only one environment variable is required in `.env.local`:

```env
# Server-side MongoDB Connection (Dedicated read-only credentials)
MONGODB_URI=mongodb+srv://<readonly_user>:<password>@cluster0.dt2fqzc.mongodb.net/adviora_prod?retryWrites=true&w=majority
```

Never commit `.env.local`. Keep safe placeholders in `.env.example`.

## Development & Production Commands

```bash
# Install dependencies
npm install

# Start development server on port 3001
npm run dev

# Run type check
npm run typecheck

# Run linter
npm run lint

# Run unit tests
npm test

# Production build
npm run build
```