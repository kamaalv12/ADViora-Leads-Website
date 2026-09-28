# ADViora Leads Operations Dashboard — Setup & Deployment Guide

## 1. Local Development Setup

### Prerequisites
- Node.js LTS `v24.x` (or `>=20 <25`)
- npm `11.x`
- Dedicated read-only MongoDB credentials for `adviora_prod`

### Setup Instructions
1. Clone the repository and checkout the feature branch:
   ```bash
   git clone https://github.com/kamaalv12/ADViora-Leads-Website.git
   cd ADViora-Leads-Website
   git checkout feat/adviora-leads-dashboard
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Add your dedicated read-only MongoDB URI:
   ```env
   MONGODB_URI=mongodb+srv://<readonly_user>:<password>@cluster0.dt2fqzc.mongodb.net/adviora_prod?retryWrites=true&w=majority
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
   The dashboard runs on `http://localhost:3001` (or `http://localhost:3000`).

---

## 2. Dedicated Read-Only MongoDB User Setup

To guarantee read-only database operations:
1. In **MongoDB Atlas**: Navigate to **Database Access** $\rightarrow$ **Add New Database User**.
2. Select **Built-in Role** $\rightarrow$ **Read any database** (or custom role granting only `read` on `adviora_prod`).
3. Ensure write, drop, and index-creation permissions are **not** granted.
4. Supply this connection string in `MONGODB_URI`.

---

## 3. Mandatory Hosting-Level Access Protection on Vercel

> [!CAUTION]
> Because this dashboard displays internal customer lead information, **hosting-level access protection is a mandatory deployment condition, not an optional enhancement**.
> `robots.ts` Disallow and phone masking are supplementary measures; they do not provide authentication or authorization.

### Required Vercel Protection Configuration
Before deploying to production or a custom domain (`leads.advioraconsulting.com`):

1. **Vercel Password Protection / Deployment Protection**:
   - In the Vercel Dashboard, go to **Project Settings** $\rightarrow$ **Deployment Protection**.
   - Enable **Password Protection** (or **Vercel Authentication** for team members).
   - This ensures that **every page, every API route (`/api/*`), and CSV export (`/api/leads/export`)** on both Preview URLs and Production domains requires authentication at the Vercel edge before serving any response.
2. **Custom Domain Setup (Future Approval)**:
   - When approved by management, map `leads.advioraconsulting.com` as a CNAME pointing to `cname.vercel-dns.com`.
   - **Never** modify the root (`advioraconsulting.com`) or `www` DNS records belonging to the main public website.
3. **Deployment Blocker Notice**:
   - If your Vercel plan does not support Deployment Protection / Password Protection, **do not deploy to a publicly accessible URL**. Keep the dashboard running locally or within an internal network until hosting-level protection is configured.
