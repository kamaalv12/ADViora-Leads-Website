# ADViora Leads Operations Dashboard — Data Contract

## 1. Database Collections & Projections

All queries run in read-only mode with `{ autoIndex: false, autoCreate: false }` against the database parsed dynamically from `MONGODB_URI`.

### `users`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary user identifier |
| `name` | `string` | Yes | Lead full name |
| `email` | `string` | Yes | Unique normalized lowercase email |
| `phone` | `string` | Yes | Unique 10-digit Indian phone number |
| `countryCode` | `string` | Yes | Country code (default `+91`) |
| `timezone` | `string` | Yes | Timezone (default `Asia/Kolkata`) |
| `status` | `string` | Yes | `'ACTIVE' \| 'DELETED' \| 'ONHOLD'` |
| `createdAt` | `Date` | Yes | Account registration timestamp |

### `service_enquiries`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Primary enquiry identifier |
| `userId` | `ObjectId` | Yes | Foreign key to `users._id` |
| `interest` | `string` | Yes | Service interest: `Business transformation`, `ITSM / AI / digital transformation`, or `Professional training` |
| `message` | `string` | Yes | Enquiry goals / message body |
| `createdAt` | `Date` | Yes | Enquiry submission timestamp |

### `utm_campaigns`
| Field | Type | Attribution Evidence? | Description |
| :--- | :--- | :---: | :--- |
| `userId` | `ObjectId` | — | Foreign key to `users._id` |
| `route` | `string` | Contextual | Landing route where submitted |
| `utm_source` | `string` | **Yes** | Campaign traffic source |
| `utm_medium` | `string` | **Yes** | Campaign traffic medium |
| `utm_campaign` | `string` | **Yes** | Campaign name |
| `utm_content` | `string` | **Yes** | Ad creative / variation |
| `utm_term` | `string` | **Yes** | Paid search term |
| `platform` | `string` | **Yes** | Advertising platform |
| `gclid` | `string` | **Yes** | Google click ID |
| `fbclid` | `string` | **Yes** | Meta / Facebook click ID |
| `fbc` | `string` | **Yes** | Meta click tracking cookie |
| `fbp` | `string` | **No** | Meta browser cookie ID (browser identifier, not attribution evidence) |
| `device` | `string` | **No** | Device hardware (mobile/desktop, not attribution evidence) |
| `keyword` | `string` | Contextual | Targeting keyword |
| `matchtype` | `string` | Contextual | Match type (e.g. `e`, `p`, `b`) |
| `network` | `string` | Contextual | Network type (e.g. `g`, `s`, `d`) |
| `placement` | `string` | **Yes** | Ad placement location |
| `campaignid` | `string` | **Yes** | Platform campaign ID |
| `adgroupid` | `string` | **Yes** | Platform ad set / ad group ID |
| `clientIp` | `string` | **Excluded** | Internal infrastructure only. Never projected or exported. |
| `userAgent` | `string` | **Excluded** | Internal infrastructure only. Never projected or exported. |

---

## 2. API Contracts

### `GET /api/leads`
- **Query Parameters**:
  - `range`: `'today' | '7days' | 'all' | 'custom'`
  - `startDate`, `endDate`: `YYYY-MM-DD` (Required if `range=custom`)
  - `search`: string (debounced regex-escaped)
  - `interest`: `'all' | 'Business transformation' | 'ITSM / AI / digital transformation' | 'Professional training'`
  - `attribution`: `'all' | 'attributed' | 'unattributed'`
  - `utm_source`, `utm_medium`, `utm_campaign`: string
  - `sort`: `'latest' | 'oldest'`
  - `page`: integer (`>= 1`, default 1)
  - `limit`: `10 | 25 | 50 | 100` (default 25)
- **Response**:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "uniqueLeads": 142,
      "totalEnquiries": 168,
      "newLeads": 110,
      "returningLeads": 32,
      "activeRangeLabel": "Last 7 Days (22 Sep 2026 – 28 Sep 2026)"
    },
    "leads": [
      {
        "serialNumber": 1,
        "userId": "67...",
        "name": "Lead Name",
        "phone": "+91 9876543210",
        "maskedPhone": "+91 98XXX XX210",
        "email": "lead@example.com",
        "latestInterest": "Business transformation",
        "firstEnquiryDate": "2026-09-24T05:30:00.000Z",
        "latestEnquiryDate": "2026-09-28T09:15:00.000Z",
        "totalEnquiries": 2,
        "totalTouchpoints": 3,
        "primaryAttribution": {
          "status": "attributed",
          "source": "google",
          "medium": "cpc",
          "campaign": "search_brand",
          "badgeLabel": "google / cpc",
          "timestamp": "2026-09-28T09:15:00.000Z"
        }
      }
    ],
    "pagination": {
      "total": 142,
      "page": 1,
      "limit": 25,
      "totalPages": 6,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### `GET /api/leads/[id]`
- **Route Parameter**: `id` (24-character hex ObjectId)
- **Query Parameters**:
  - `enquiriesPage`, `enquiriesLimit` (default `page: 1`, `limit: 10`)
  - `touchpointsPage`, `touchpointsLimit` (default `page: 1`, `limit: 10`)
- **Response**: Allowlisted user profile, independently paged enquiry history, and independently paged campaign touchpoints.

### `GET /api/leads/export`
- **Output**: UTF-8 BOM CSV stream with RFC 4180 formatting.
- **Formula Injection Defense**: Cells starting with `=, +, -, @, \t, \r, |` (even after leading whitespace or control characters) are prepended with `'`.
- **Response Headers**:
  - `X-Export-Total-Matched`: Total matching unique leads.
  - `X-Export-Rows-Returned`: Number of rows exported (capped at 1,000).
  - `X-Export-Truncated`: `'true'` if total matching leads exceeded 1,000.
