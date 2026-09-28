# ADViora Leads Operations Dashboard — Project Context & Scope

## 1. Project Overview & Scope
- **Client**: ADViora Consulting
- **Dashboard Repository**: `https://github.com/kamaalv12/ADViora-Leads-Website`
- **Main Website Repository (Read-Only Reference)**: `https://github.com/kamaalv12/ADViora-website`
- **Main Website URL**: `https://www.advioraconsulting.com/`
- **Architecture**: Compact, read-only internal operations dashboard. It is strictly not a CRM: lead editing, deletion, assignment, and automated messaging are excluded by design.

## 2. Strict Repository & Deployment Separation
- All dashboard UI, server queries, configurations, and deployment configuration live exclusively in this repository (`ADViora-Leads-Website`).
- **Main Website Isolation**: The main website's code, models, deployment, domain, DNS, and its disabled `/api/user-details` route remain completely untouched.
- No runtime file or package imports from the main website. All assets (logos, icons) are copied directly into `/public`.

## 3. Database Architecture & Collections
Connects server-side in read-only mode to the ADViora production MongoDB (`adviora_prod`):
- **`users`**: Demographics and contact information deduplicated by normalized 10-digit Indian phone number (`name`, `email`, `phone`, `countryCode`, `timezone`, `status`, `createdAt`, `updatedAt`).
- **`service_enquiries`**: Service-specific enquiry messages (`userId`, `interest`, `message`, `createdAt`, `updatedAt`).
- **`utm_campaigns`**: Multi-touch marketing attribution touchpoints (`userId`, `route`, 17 tracking fields, `createdAt`, `updatedAt`).

### Attribution Linkage Rule
The database schema does not have a foreign key linking individual `service_enquiries` to `utm_campaigns`. They are related exclusively through `userId`. The dashboard displays individual enquiries alongside the lead's lifetime touchpoint history, without inventing an artificial 1:1 attribution binding.

## 4. Privacy, Discovery, & Access Security
- **Access Architecture**: Direct Internal Access (matching the C2C pattern used across Noble Care 4 U and JIB Solar).
- **Search Engine Blocking**: Restrictive `app/robots.ts` (`Disallow: /`) and layout-level `noindex, nofollow, noarchive` metadata prevent crawler indexing.
- **Phone Masking**: Overview table displays masked phone numbers (`+91 98XXX XX210`) for visual privacy, with full unmasked phone numbers visible only inside the individual Lead Detail drawer.
- **Hosting-Level Protection**: Hosting protection (such as Vercel Password Protection or Vercel Deployment Protection) must be enabled on the Vercel project dashboard to guard against unauthorized access across all routes, API endpoints, and CSV exports.
- **Telemetry Exclusion**: `clientIp` and `userAgent` are never queried, rendered, or exported.
