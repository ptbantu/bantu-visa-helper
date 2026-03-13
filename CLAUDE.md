# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

Bantu Visa Assistant is a full-stack Next.js application for managing visa records and tracking visa expiration dates. The architecture consists of:

- **Frontend**: React 19 with shadcn/ui components, styled with Tailwind CSS
- **Backend**: Next.js 16 API routes (`app/api/`)
- **Database**: SQLite with Prisma ORM
- **Internationalization**: Chinese (`zh`) and Indonesian (`id`) translations via `LanguageContext.tsx`

The project uses the App Router pattern (Next.js 13+) with the `/app` directory structure for pages and routes.

## Quick Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (localhost:8081)
npm run build            # Production build
npm start                # Start production server (localhost:3000)
npm run lint             # TypeScript type checking (tsc --noEmit)
```

## Data Models & Database

### Core Schema (`src/types/api.ts`)
Defines TypeScript interfaces:
- **VisaRecord**: Main data model stored in database (passport_no, expiry_date, visa_type, is_urgent, customer_name, phone, whatsapp, reminder_enabled)
- **Visa**: UI representation with denormalized fields
- **Reminder**: Tracks expiring visas with stage (5-3-1 system)
- **Customer**: Customer profile
- **SystemLog**: Audit logs for email parsing, visa extraction, push notifications
- **AppSettings**: Configuration for email scraping and push notifications (WeCom, Voice Bot)

### Database Layer (`prisma/schema.prisma`)
Uses SQLite with Prisma as ORM. Key table: `VisaRecord` with unique constraint on `passport_no`.

To migrate schema changes:
```bash
npx prisma migrate dev --name <migration_name>
npx prisma generate                              # Regenerate Prisma client
```

Access Prisma client via `src/lib/prisma.ts`.

### Mock Data (`src/lib/mock.ts`, `src/data/mock.ts`)
Sample data for development. Components fetch from API routes which may fall back to mock data.

## Key Code Locations

### Pages & Routes
- `app/page.tsx`: Dashboard (B211A visa list)
- `app/kitas/page.tsx`: KITAS/C31x visa management
- `app/reminders/page.tsx`: Reminder tracking (5-3-1 system)
- `app/logs/page.tsx`: System logs and audit trail
- `app/settings/page.tsx`: Email and push notification configuration

### API Endpoints
- `app/api/visas/route.ts`: GET (list), POST (create) VisaRecords
- `app/api/visas/[passport_no]/route.ts`: GET, PATCH, DELETE individual records
- `app/api/visas/bulk/route.ts`: Bulk operations

### Components & UI
- `src/components/app-sidebar.tsx`: Main navigation sidebar
- `src/components/KitasWorkflow.tsx`: KITAS management workflow
- `src/components/EditContactDialog.tsx`: Contact detail editing
- `src/components/ui/`: shadcn/ui component library

### Styling & Utilities
- `src/index.css`: Tailwind CSS configuration and globals
- `src/lib/utils.ts`: Utility functions (cn for classname merging)

## Development Notes

### TypeScript Configuration
- Target: ES2022, jsx: react-jsx
- Path alias: `@/*` maps to project root
- Strict mode is disabled (`"strict": false`)
- See `tsconfig.json` for full config

### Language/i18n
Language context persists to localStorage under key `appLanguage`. To add translations, update `src/contexts/LanguageContext.tsx` with new language strings.

### Common Patterns
- Components use React hooks (useState, useEffect, useMemo)
- API data fetching in useEffect hooks (see app/page.tsx for example)
- Status filtering: visas categorized as B211A (exclude ITAS/C31x/工作/投资) or KITAS (include C31x/工作/投资)
- Visa status labels: "有效" (valid), "即将过期" (expiring soon), "已过期" (expired), "处理中" (processing)
