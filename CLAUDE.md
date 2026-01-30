# CLAUDE.md - AI Assistant Guide for World Developer Portal

> Last updated: 2026-01-30
>
> This document provides comprehensive guidance for AI assistants working on the World Developer Portal codebase.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Development Setup](#development-setup)
5. [Architecture Patterns](#architecture-patterns)
6. [Code Conventions](#code-conventions)
7. [Database & GraphQL](#database--graphql)
8. [API Organization](#api-organization)
9. [Frontend Structure](#frontend-structure)
10. [Testing Strategy](#testing-strategy)
11. [Common Tasks](#common-tasks)
12. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Overview

**World Developer Portal** is a full-stack TypeScript monorepo providing tools for developers to interact with the World ID Protocol. It enables:

- Application management and configuration
- Team collaboration with role-based access control
- World ID verification and proof validation
- Sign in with World ID (OIDC implementation)
- Analytics and usage tracking
- Dynamic action creation and management

**Key Characteristics:**
- Modern Next.js 14 with App Router
- GraphQL-first backend powered by Hasura
- Production-ready with comprehensive monitoring
- Enterprise authentication via Auth0
- AWS integration (KMS, S3, CloudFront, Parameter Store)

---

## Repository Structure

```
/home/user/developer-portal/
├── web/                          # Main Next.js application
│   ├── app/                     # Next.js App Router pages
│   │   ├── (onboarding)/       # Login, join, signup flows
│   │   ├── (portal)/           # Main authenticated dashboard
│   │   └── (unauthorized)/     # Error pages
│   ├── api/                     # API route handlers
│   │   ├── v1/                 # OIDC, precheck, debugger
│   │   ├── v2/                 # Verify, public APIs, Minikit
│   │   ├── v4/                 # Newer verify, proof-context
│   │   └── hasura/             # Internal Hasura event handlers
│   ├── components/             # Reusable UI components (45+ directories)
│   ├── scenes/                 # Page-level containers
│   ├── lib/                    # Utilities, helpers, services
│   ├── services/               # External service clients
│   ├── graphql/                # GraphQL schema and generated types
│   ├── styles/                 # Global CSS and Tailwind
│   └── public/                 # Static assets
├── hasura/                      # GraphQL engine configuration
│   ├── migrations/             # Database schema migrations
│   ├── metadata/               # GraphQL metadata, permissions
│   └── seeds/                  # Test data
├── tests/                       # Root-level test configuration
│   ├── e2e/                    # Playwright E2E tests
│   ├── integration/            # Integration tests
│   ├── unit/                   # Jest unit tests
│   └── api/                    # API route tests
├── .github/                     # GitHub Actions CI/CD
├── docker-compose.yaml          # Local development services
├── docker-compose-test.yaml     # Testing services
└── Makefile                     # Convenience commands
```

### Key Directories Explained

- **`web/app/`**: Next.js 13+ App Router with grouped routes using parentheses
- **`web/components/`**: Atomic design - buttons, inputs, dialogs, dropdowns (45+ types)
- **`web/scenes/`**: Larger page-level components composed from smaller components
- **`web/api/`**: Versioned API routes (v1, v2, v4) + internal handlers
- **`web/lib/`**: Shared utilities (permissions, crypto, Redis, OpenSearch, schema validation)
- **`hasura/`**: Database migrations and GraphQL metadata

---

## Technology Stack

### Core Framework
- **Next.js** 14.2.25 - Full-stack React framework with App Router
- **React** 18.3.1 - UI library
- **TypeScript** 5.3.3 - Type safety throughout

### Backend & Data
- **Hasura** v2.47.0 - GraphQL engine over PostgreSQL
- **PostgreSQL** 16 - Primary database
- **Redis** 6 - Caching and session management
- **OpenSearch** 3 - Full-text search for app metadata
- **GraphQL Code Generator** - Type-safe GraphQL operations

### Frontend
- **Tailwind CSS** 3.4.1 - Utility-first styling with custom theme
- **Apollo Client** 3.9.0 - GraphQL client for components/scenes
- **Jotai** 2.9.1 - Lightweight state management
- **React Hook Form** 7.51.0 - Form handling
- **Yup** 1.3.3 - Schema validation
- **Headless UI** & **Radix UI** - Accessible component primitives

### Authentication & Security
- **Auth0** 3.5.0 - Identity provider
- **JWT/JOSE** 5.3.0 - Token handling
- **AWS KMS** - Cryptographic signing
- **AWS SigV4** - Signed AWS requests

### Testing
- **Playwright** 1.49.1 - E2E testing
- **Jest** 29.7.0 - Unit/integration testing
- **Playwright-Qase-Reporter** - Test reporting

### Monitoring & Observability
- **DataDog** (dd-trace 5.59.0) - APM and tracing
- **PostHog** 1.166.1 - Product analytics
- **Winston** 3.11.0 - Structured logging

### Build & Infrastructure
- **pnpm** 9.15.4 - Package manager (required)
- **Node.js** 20.15.1+ - Runtime
- **Docker** - Containerization (Alpine Linux base)

---

## Development Setup

### Prerequisites

1. **Node.js** 20+ (check `.nvmrc`)
2. **pnpm** 9.15.4
3. **Docker** and Docker Compose
4. **AWS credentials** with KMS access (required for crypto operations)

### Initial Setup

```bash
# 1. Clone and enter repository
cd /home/user/developer-portal

# 2. Copy environment file
cd web
cp .env.test .env

# 3. Configure AWS credentials (required)
# Add AWS credentials with KMS permissions to your environment
# See web/aws-role-sample-policy.json for required permissions

# 4. Start infrastructure services
docker compose up --detach
# This starts: PostgreSQL, Hasura, Redis, OpenSearch

# 5. Install dependencies
cd web
pnpm install

# 6. Start development server
pnpm dev
# App runs at http://localhost:3000
# Hasura console at http://localhost:8080
```

### Makefile Commands

```bash
make up              # Start Docker services
make hasura-console  # Open Hasura console for DB changes
make hasura-migrate  # Apply database migrations
make hasura-seed     # Apply seed data
make hasura-metadata # Export Hasura metadata
```

### Environment Variables

Key variables in `.env`:

**Required for Development:**
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` - Database connection
- `JWT_ISSUER`, `GENERAL_SECRET_KEY` - Authentication
- AWS credentials (for KMS access)

**External Services (optional for local dev):**
- `AUTH0_*` - Auth0 configuration
- `SENDGRID_*` - Email sending
- `ALCHEMY_API_KEY` - Blockchain RPC
- `NEXT_PUBLIC_POSTHOG_*` - Analytics

---

## Architecture Patterns

### 1. Layered Architecture

```
┌────────────────────────────────────┐
│   Next.js App Router (Pages)       │  ← User-facing routes
├────────────────────────────────────┤
│   Scenes (Page Containers)         │  ← Composed page logic
├────────────────────────────────────┤
│   Components (UI Primitives)       │  ← Reusable UI elements
├────────────────────────────────────┤
│   API Routes (v1, v2, v4)          │  ← RESTful endpoints
├────────────────────────────────────┤
│   Helpers & Services               │  ← Business logic
├────────────────────────────────────┤
│   Hasura GraphQL Layer             │  ← Auto-generated GraphQL API
├────────────────────────────────────┤
│   PostgreSQL Database              │  ← Data persistence
├────────────────────────────────────┤
│   Redis (Cache) + OpenSearch       │  ← Supporting services
└────────────────────────────────────┘
```

### 2. API Versioning Strategy

The application maintains **multiple API versions** for backward compatibility:

- **v1**: OIDC flows, precheck, JWKS, debugger
- **v2**: Verify endpoint, dynamic actions, public app data, Minikit
- **v4**: Newer verify and proof-context endpoints (with v4 nullifiers)

**When to create new versions:**
- Breaking changes to request/response formats
- New cryptographic protocols (e.g., v3 → v4 nullifiers)
- Major feature rewrites requiring different data models

**DO NOT:**
- Create new versions for additive changes
- Modify existing version behavior (always maintain backward compatibility)

### 3. Role-Based Access Control (RBAC)

Implemented at multiple levels:

**Middleware Level** (`/web/middleware.ts`):
```typescript
// Route-level restrictions
const ONLY_OWNER_ROUTES = ["/teams/[teamId]/danger"];
const ONLY_OWNER_AND_ADMIN_ROUTES = ["/teams/[teamId]/api-keys"];
```

**Server Component Level** (`/web/lib/permissions/`):
```typescript
import { checkMembershipPermission } from "@/lib/permissions";

await checkMembershipPermission({
  hasuraRoleName: role,
  teamId,
  action: "update",
  errorMessage: "Forbidden"
});
```

**Role Types:**
- **Owner**: Full permissions including team deletion
- **Admin**: Most permissions except team deletion
- **Member**: Read-only access to team resources

### 4. Grouped Routes (Next.js)

Routes in parentheses don't appear in URLs:

```
app/
├── (onboarding)/         # /login, /join, /create-team
├── (portal)/             # /teams/[teamId]/apps/...
└── (unauthorized)/       # /unauthorized
```

**Benefits:**
- Shared layouts without URL nesting
- Logical code organization
- Different middleware rules per group

### 5. GraphQL Code Generation

All GraphQL operations are type-safe:

**Pattern:**
```
api/v1/oidc/token/
├── index.ts                           # API route handler
├── graphql/
│   ├── fetch-token.graphql           # GraphQL query
│   └── fetch-token.generated.ts      # Generated types & SDK
```

**Generated outputs:**
- Type-safe operation functions
- Input/output TypeScript types
- Apollo Client hooks (for components)
- GraphQL Request SDKs (for API routes)

---

## Code Conventions

### File Naming

- **Components**: PascalCase directories (`Button/`, `Dropdown/`)
- **API routes**: kebab-case (`oidc/`, `verify-app/`)
- **Utilities**: camelCase (`crypto.ts`, `logger.ts`)
- **GraphQL files**: kebab-case with `.graphql` extension
- **Generated files**: `.generated.ts` suffix (never edit manually)

### TypeScript Standards

**Strict Mode Enabled:**
```typescript
// tsconfig.json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

**Path Aliases:**
```typescript
import { Button } from "@/components/Button";    // web/*
import { helper } from "@/api/helpers/utils";    // web/api/*
import { test } from "@e2e/helpers";             // tests/e2e/*
```

### Code Style

**ESLint Configuration:**
- Extends `next` and `tailwindcss/recommended`
- Tailwind class order enforcement
- No unused variables

**Prettier Configuration:**
```javascript
{
  trailingComma: "all",  // Always add trailing commas
  plugins: ["prettier-plugin-tailwindcss"]  // Auto-sort Tailwind classes
}
```

**Commands:**
```bash
pnpm lint        # Run ESLint
pnpm format      # Format with Prettier
pnpm typecheck   # TypeScript validation
```

### Component Patterns

**Server Components (default in App Router):**
```typescript
// app/(portal)/teams/[teamId]/page.tsx
export default async function TeamPage({ params }: { params: { teamId: string } }) {
  const data = await fetchData(params.teamId);
  return <div>{data.name}</div>;
}
```

**Client Components (with interactivity):**
```typescript
// components/Button/index.tsx
"use client";

import { useState } from "react";

export const Button = ({ onClick }: Props) => {
  const [loading, setLoading] = useState(false);
  // ...
};
```

**GraphQL in Components:**
```typescript
// scenes/Portal/Apps/client/AppsList/index.tsx
"use client";

import { useQuery } from "@apollo/client";
import { GetAppsDocument } from "./graphql/get-apps.generated";

export const AppsList = () => {
  const { data, loading } = useQuery(GetAppsDocument);
  // ...
};
```

### API Route Patterns

**Standard structure:**
```typescript
// api/v2/verify/index.ts
import { NextRequest, NextResponse } from "next/server";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getSdk } from "./graphql/verify.generated";

export async function POST(req: NextRequest) {
  // 1. Validate request
  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    value: await req.json(),
    schema: verifySchema,
  });

  if (!isValid) return handleError();

  // 2. Get GraphQL client
  const client = await getAPIServiceGraphqlClient();

  // 3. Execute queries/mutations
  const result = await getSdk(client).InsertNullifier({...});

  // 4. Return response
  return NextResponse.json({ success: true });
}
```

**Key principles:**
- Always validate input with Yup schemas
- Use generated GraphQL SDKs (never raw queries)
- Return proper HTTP status codes
- Log errors with Winston

---

## Database & GraphQL

### Database Schema (Key Tables)

```sql
-- Core entities
app                    -- Applications registered in portal
app_metadata          -- App details (name, description, images)
user                  -- Portal users (from Auth0)
team                  -- Developer teams
membership            -- User-team relationships with roles

-- World ID verification
action                -- World ID actions (v3)
action_v4             -- World ID actions (v4 - new format)
nullifier             -- Used nullifiers (v3)
nullifier_v4          -- Used nullifiers (v4)
nullifier_uses_seen   -- Tracking nullifier usage

-- Authentication
api_key               -- App API keys
auth_code             -- OIDC authorization codes
jwt_key               -- JWKS for token signing

-- Analytics & monitoring
app_stats             -- Application usage statistics
app_daily_users       -- Daily active users tracking

-- Utilities
cache                 -- Generic caching table
notification_log      -- Event/notification logs
app_report            -- App abuse reports
```

### Hasura Structure

**Migrations** (`/hasura/migrations/`):
- Sequential SQL files for schema changes
- Named: `[timestamp]_[description]`
- Applied automatically on startup

**Metadata** (`/hasura/metadata/`):
- `databases.yaml` - Database connections
- `tables.yaml` - Table configurations
- `rest_endpoints.yaml` - REST API mappings
- `actions.yaml` - Custom business logic endpoints

**Making Database Changes:**

```bash
# 1. Start Hasura console (REQUIRED)
make hasura-console

# 2. Make changes in console UI (http://localhost:9695)
#    - NOT directly at http://localhost:8080
#    - Console auto-generates migration files

# 3. Changes are saved to:
#    - hasura/migrations/ (schema changes)
#    - hasura/metadata/ (GraphQL config)

# 4. Commit migration files with your code
git add hasura/
git commit -m "feat: add new_table"
```

**IMPORTANT:** Never make changes directly in `http://localhost:8080` - they won't be saved to migration files!

### GraphQL Code Generation

**Configuration:** `web/graphql-codegen.types.js`

**Process:**
1. Write `.graphql` files next to components/API routes
2. Run `pnpm generate:graphql-types`
3. Import from `.generated.ts` files

**Example:**
```graphql
# api/v2/verify/graphql/insert-nullifier.graphql
mutation InsertNullifier($nullifier: String!, $action_id: String!) {
  insert_nullifier_one(object: {
    nullifier_hash: $nullifier,
    action_id: $action_id
  }) {
    id
  }
}
```

**Generated output:**
```typescript
// api/v2/verify/graphql/insert-nullifier.generated.ts
export type InsertNullifierMutation = { ... };
export type InsertNullifierMutationVariables = { ... };
export const InsertNullifierDocument = gql`...`;

// SDK for API routes
export function getSdk(client: GraphQLClient) {
  return {
    InsertNullifier: async (variables: InsertNullifierMutationVariables) => {...}
  };
}
```

---

## API Organization

### API Version Structure

```
api/
├── v1/                           # Version 1 endpoints
│   ├── oidc/                    # OpenID Connect
│   │   ├── authorize/
│   │   ├── token/
│   │   ├── introspect/
│   │   └── openid-configuration/
│   ├── precheck/[app_id]/       # Pre-verification checks
│   ├── rp-status/[rp_id]/       # Relying party status
│   ├── jwks/                    # JSON Web Key Set
│   └── debugger/                # Debug utilities
├── v2/                           # Version 2 endpoints
│   ├── verify/                  # World ID proof verification
│   ├── create-action/           # Dynamic action creation
│   ├── public/                  # Unauthenticated endpoints
│   │   ├── apps/
│   │   ├── app/[app_id]/
│   │   └── apps/search/[term]/
│   ├── app/submit-app-review/
│   └── minikit/app-metadata/[app_id]/
├── v4/                           # Version 4 endpoints
│   ├── verify/                  # Updated verification
│   ├── proof-context/[id]/      # Proof context (precheck v2)
│   └── rp-status/[rp_id]/       # Updated RP status
├── hasura/                       # Internal event handlers
│   ├── create-new-draft/        # Hasura action handlers
│   ├── verify-app/
│   ├── reset-api-key/
│   ├── invite-team-members/
│   ├── upload-image/
│   └── ...
├── login-callback/               # Auth0 callbacks
├── join-callback/
├── update-session/
└── _*/                           # Background jobs (underscore prefix)
    ├── _delete-expired-auth-codes/
    ├── _gen-external-nullifier/
    └── _rollup-app-stats/
```

### Authentication Patterns

**Public endpoints** (no auth required):
```typescript
// api/v2/public/apps/route.ts
export async function GET(req: NextRequest) {
  // No auth check needed
  const apps = await fetchPublicApps();
  return NextResponse.json(apps);
}
```

**API key authentication:**
```typescript
// api/v2/verify/route.ts
import { verifyAPIKey } from "@/api/helpers/verify-api-key";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("authorization");
  const { app, isValid } = await verifyAPIKey(apiKey);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  // Proceed with verification
}
```

**Session authentication:**
```typescript
// api/hasura/verify-app/route.ts
import { getSession } from "@auth0/nextjs-auth0";

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // User is authenticated
}
```

### Common API Helpers

**Location:** `/web/api/helpers/`

- `validate-request-schema.ts` - Yup validation wrapper
- `verify-api-key.ts` - API key verification
- `graphql.ts` - GraphQL client factory
- `crypto.ts` - Cryptographic operations (KMS)
- `errors.ts` - Standard error responses

---

## Frontend Structure

### Component Organization

**45+ component directories** following atomic design:

**Atoms** (basic UI elements):
- Button, Input, TextArea, Checkbox, Radio, Toggle, Switch
- Typography, Icon, Link, Environment

**Molecules** (simple combinations):
- Dropdown (12+ variants), Select, SelectMultiple, OtpInput
- Dialog, Tabs, Stepper, Pagination, Category

**Organisms** (complex components):
- Section, Card, LoggedUserNav, InitialSteps, Chart
- AppStatus, TeamNav, NotificationList

**Component file structure:**
```
components/
├── Button/
│   ├── index.tsx          # Main component
│   └── types.ts           # TypeScript types (if complex)
├── Dropdown/              # Complex components get subdirectories
│   ├── Dropdown/
│   ├── DropdownTrigger/
│   ├── DropdownContent/
│   ├── DropdownItem/
│   └── index.ts           # Re-exports
```

### Scenes (Page Containers)

**Purpose:** Compose components into full page layouts

```
scenes/
├── Portal/
│   ├── Profile/
│   ├── Teams/
│   │   ├── TeamSettings/
│   │   ├── TeamMembers/
│   │   └── ApiKeys/
│   ├── Apps/
│   │   ├── AppsList/
│   │   ├── AppOverview/
│   │   ├── AppConfiguration/
│   │   └── AppAnalytics/
├── Onboarding/
│   ├── Login/
│   ├── CreateTeam/
│   └── JoinTeam/
└── Root/
    ├── HowItWorks/
    └── Privacy/
```

**Scene structure:**
```typescript
// scenes/Portal/Apps/AppsList/
├── index.tsx              # Main container
├── client/                # Client-side sub-components
│   ├── FiltersBar/
│   └── AppCard/
├── graphql/               # GraphQL queries
│   ├── get-apps.graphql
│   └── get-apps.generated.ts
└── helpers.ts             # Scene-specific utilities
```

### Styling with Tailwind

**Custom theme:** `web/tailwind.config.ts`

```javascript
{
  colors: {
    blue: { 50, 100, 150, 500 },
    grey: { 0, 25, 50, 75, 100, 200, 300, 400, 500, 700, 900 },
    // + additional colors (green, purple, sea, yellow, orange, pink)
    system: { error, success, warning }
  },
  spacing: {
    // Standard + custom: 5.5, 15, 22, 30, 136, 160, 168
  },
  fontSize: {
    // Calculated proportional sizes (6-32px)
  }
}
```

**Class naming conventions:**
```tsx
// Use Tailwind's utility classes
<button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
  Click me
</button>

// Complex combinations with cn() helper
import { cn } from "@/lib/utils";

<div className={cn(
  "base classes",
  condition && "conditional classes",
  className  // Allow prop overrides
)}>
```

### State Management

**Jotai for global state:**
```typescript
// lib/store/auth.ts
import { atom } from "jotai";

export const userAtom = atom<User | null>(null);

// In component
import { useAtom } from "jotai";
import { userAtom } from "@/lib/store/auth";

const [user, setUser] = useAtom(userAtom);
```

**Apollo Client for GraphQL state:**
```typescript
// Automatic caching of GraphQL queries
const { data, loading, refetch } = useQuery(GetAppsDocument);
```

**React Hook Form for form state:**
```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: yupResolver(schema)
});
```

---

## Testing Strategy

### E2E Testing (Playwright)

**Location:** `/tests/e2e/`

**Configuration:** `web/playwright.config.ts`
```typescript
{
  timeout: 60000,              // 60 second timeout per test
  workers: 1,                  // Serial execution (database isolation)
  use: {
    baseURL: "http://localhost:3000",
    browserName: "chromium",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  }
}
```

**Test structure:**
```typescript
// tests/e2e/specs/app.spec.ts
import { test, expect } from "@playwright/test";

test.describe("App Management", () => {
  test("should create new app", async ({ page }) => {
    await page.goto("/teams/test-team/apps");
    await page.click("[data-testid='create-app-button']");
    await page.fill("[name='app_name']", "Test App");
    await page.click("[type='submit']");

    await expect(page.locator("text=Test App")).toBeVisible();
  });
});
```

**Helpers for test data:**
```typescript
// tests/e2e/helpers/hasura/
import { createUser } from "@e2e/helpers/hasura/user";
import { createTeam } from "@e2e/helpers/hasura/team";
import { createApp } from "@e2e/helpers/hasura/app";

// In test setup
const user = await createUser({ email: "test@example.com" });
const team = await createTeam({ owner_id: user.id });
const app = await createApp({ team_id: team.id });
```

**Running tests:**
```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e tests/e2e/specs/app.spec.ts

# Run with UI mode (debugging)
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

### Unit Testing (Jest)

**Location:** `/tests/unit/`

**Configuration:** `web/jest.config.ts`

**Example test:**
```typescript
// tests/unit/lib/utils.test.ts
import { parseLocale } from "@/lib/utils";

describe("parseLocale", () => {
  it("should parse valid locale", () => {
    expect(parseLocale("en-US")).toEqual({ language: "en", region: "US" });
  });

  it("should handle invalid locale", () => {
    expect(parseLocale("invalid")).toBeNull();
  });
});
```

**Running tests:**
```bash
pnpm test:unit
```

### Integration Testing

**Location:** `/tests/integration/`

**Purpose:** Test API routes with real database

**Setup:**
```bash
# Uses separate test database (port 5433)
docker compose -f docker-compose-test.yaml up --detach

# Run tests
pnpm test:integration
```

### Test Data Management

**Hasura helpers** create test data via GraphQL:

```typescript
// tests/e2e/helpers/hasura/app/create-app.ts
export async function createApp(params: {
  team_id: string;
  name?: string;
  status?: AppStatus;
}) {
  const client = getHasuraClient();
  const { insert_app_one } = await getSdk(client).CreateApp({
    object: {
      team_id: params.team_id,
      name: params.name ?? "Test App",
      status: params.status ?? "unverified"
    }
  });

  return insert_app_one;
}
```

**Cleanup in teardown:**
```typescript
// tests/e2e/global-teardown.ts
export default async function globalTeardown() {
  await cleanupTestData();
  await closeConnections();
}
```

---

## Common Tasks

### Adding a New Component

```bash
# 1. Create component directory
mkdir web/components/NewComponent

# 2. Create component file
cat > web/components/NewComponent/index.tsx << 'EOF'
"use client"; // If needs interactivity

export const NewComponent = () => {
  return <div>New Component</div>;
};
EOF

# 3. Export from components (if needed)
echo "export { NewComponent } from './NewComponent';" >> web/components/index.ts

# 4. Use in app
# import { NewComponent } from "@/components/NewComponent";
```

### Adding a New API Route

```bash
# 1. Create route directory
mkdir -p web/api/v2/new-endpoint

# 2. Create GraphQL query (if needed)
mkdir web/api/v2/new-endpoint/graphql
cat > web/api/v2/new-endpoint/graphql/fetch-data.graphql << 'EOF'
query FetchData($id: uuid!) {
  app_by_pk(id: $id) {
    id
    name
  }
}
EOF

# 3. Generate GraphQL types
cd web
pnpm generate:graphql-types

# 4. Create route handler
cat > web/api/v2/new-endpoint/index.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getSdk } from "./graphql/fetch-data.generated";

export async function GET(req: NextRequest) {
  const client = await getAPIServiceGraphqlClient();
  const data = await getSdk(client).FetchData({ id: "..." });
  return NextResponse.json(data);
}
EOF
```

### Adding a Database Migration

```bash
# 1. Start Hasura console (REQUIRED!)
make hasura-console

# 2. Navigate to http://localhost:9695
#    Make changes in UI (add table, modify columns, etc.)

# 3. Migration files auto-generated in:
#    hasura/migrations/default/[timestamp]_[description]/

# 4. Verify migration
make hasura-migrate

# 5. Commit migration files
git add hasura/migrations/
git commit -m "feat: add new_table"
```

### Updating GraphQL Schema

```bash
# After making Hasura changes:

# 1. Export updated metadata
cd hasura
hasura metadata export --admin-secret secret!

# 2. Introspect schema
cd ../web
pnpm generate:graphql-types

# 3. All .generated.ts files will be updated
```

### Running the Full Stack Locally

```bash
# Terminal 1: Infrastructure
docker compose up --detach

# Terminal 2: Next.js dev server
cd web
pnpm dev

# Terminal 3: Hasura console (optional)
make hasura-console

# Terminal 4: Run tests (optional)
cd web
pnpm test:e2e
```

### Debugging Issues

**Check service status:**
```bash
docker compose ps
```

**View logs:**
```bash
docker compose logs postgres
docker compose logs hasura
docker compose logs redis
docker compose logs opensearch
```

**Reset database:**
```bash
docker compose down -v  # Removes volumes
docker compose up --detach
make hasura-migrate
make hasura-seed
```

**Clear Redis cache:**
```bash
docker compose exec redis redis-cli FLUSHALL
```

---

## AI Assistant Guidelines

### General Principles

1. **Always read before modifying** - Never propose changes to code you haven't read
2. **Prefer existing patterns** - Follow established conventions in the codebase
3. **Maintain backward compatibility** - Especially for API routes
4. **Test your changes** - Run relevant tests before committing
5. **Use type-safe operations** - Never bypass TypeScript or GraphQL type generation

### Code Modification Rules

**DO:**
- Use generated GraphQL types (`.generated.ts` files)
- Follow existing component patterns
- Add validation to API routes with Yup schemas
- Use helper functions from `/lib/` and `/api/helpers/`
- Maintain consistent error handling
- Add comments for complex logic
- Update tests when changing behavior

**DO NOT:**
- Edit `.generated.ts` files directly (regenerate instead)
- Bypass authentication checks in protected routes
- Skip input validation in API routes
- Create new patterns when existing ones exist
- Add dependencies without checking existing solutions
- Modify middleware without understanding RBAC implications
- Change database schema without Hasura console

### Working with GraphQL

**When you need data:**

1. Check if query already exists in adjacent `.graphql` files
2. If not, create new `.graphql` file in same directory
3. Run `pnpm generate:graphql-types`
4. Import from `.generated.ts` file

**Example:**
```typescript
// api/v2/my-endpoint/graphql/get-app.graphql
query GetApp($id: uuid!) {
  app_by_pk(id: $id) {
    id
    name
    status
  }
}

// After generation, use in index.ts:
import { getSdk } from "./graphql/get-app.generated";

const client = await getAPIServiceGraphqlClient();
const { app_by_pk } = await getSdk(client).GetApp({ id });
```

### Security Considerations

**Always validate:**
- User input (use Yup schemas)
- API keys (use `verifyAPIKey` helper)
- Session authentication (use `getSession` from Auth0)
- Permissions (use RBAC helpers in `/lib/permissions/`)

**Never:**
- Trust client-provided data without validation
- Expose sensitive keys in client-side code
- Skip authorization checks
- Return detailed error messages to clients (use generic messages)

### Testing Requirements

**When making changes, run:**

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Relevant tests
pnpm test:unit          # For utility changes
pnpm test:e2e           # For UI/API changes
pnpm test:integration   # For database changes
```

**Add tests for:**
- New API endpoints
- Complex business logic
- Bug fixes (regression tests)
- New components with interaction logic

### Database Change Workflow

**CRITICAL:** Always use Hasura console for database changes!

```bash
# 1. Start console
make hasura-console

# 2. Make changes at http://localhost:9695
#    (NOT http://localhost:8080 directly!)

# 3. Migrations are auto-created in hasura/migrations/

# 4. Review and commit migration files
git add hasura/
git commit -m "feat: add new_table"
```

**Why:** Changes made directly to Hasura (port 8080) won't generate migration files, causing data loss in production!

### Common Pitfalls to Avoid

1. **Not regenerating GraphQL types** after schema changes
   - Always run `pnpm generate:graphql-types`

2. **Modifying generated files**
   - Never edit `.generated.ts` files directly

3. **Breaking API contracts**
   - Don't change existing API response formats
   - Create new versions instead (v5, v6, etc.)

4. **Ignoring role-based access**
   - Check middleware.ts before adding routes
   - Use permission helpers for authorization

5. **Skipping environment setup**
   - AWS credentials required for KMS operations
   - Database must be running for API routes

6. **Not using path aliases**
   - Use `@/` prefix, not relative paths like `../../`

7. **Forgetting client directive**
   - Add `"use client"` to components with hooks/interactivity

### Pull Request Checklist

Before submitting changes:

- [ ] Code follows existing patterns and conventions
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Tests pass (relevant test suites)
- [ ] GraphQL types regenerated if schema changed
- [ ] Database migrations included (if applicable)
- [ ] No sensitive data in code or commits
- [ ] Comments added for complex logic
- [ ] Backward compatibility maintained (for APIs)
- [ ] Environment variables documented (if new ones added)

### Useful Reference Locations

**When you need to:**

| Task | Location |
|------|----------|
| Add validation | `/web/lib/schema/*.ts` |
| Check permissions | `/web/lib/permissions/*.ts` |
| Add utilities | `/web/lib/*.ts` |
| Handle crypto | `/web/lib/crypto.*.ts` |
| Work with Redis | `/web/lib/redis.ts` |
| Search functionality | `/web/lib/opensearch.ts` |
| Logging | `/web/lib/logger.ts` |
| API helpers | `/web/api/helpers/*.ts` |
| GraphQL client | `/web/api/helpers/graphql.ts` |
| Error handling | `/web/api/helpers/errors.ts` |
| Test helpers | `/tests/e2e/helpers/**/*.ts` |

### Getting Help

**Documentation:**
- Next.js: https://nextjs.org/docs
- Hasura: https://hasura.io/docs
- Apollo Client: https://www.apollographql.com/docs/react
- Playwright: https://playwright.dev/docs/intro

**Project-specific:**
- Main README: `/home/user/developer-portal/README.md`
- Hasura README: `/home/user/developer-portal/hasura/README.md`
- Web README: `/home/user/developer-portal/web/README.md`
- Tests README: `/home/user/developer-portal/tests/api/README.md`

**Code owners:**
- @andy-t-wang
- @decentralgabe
- @Gr1dlock
- @bin-umar

---

## Conclusion

This codebase represents a production-grade full-stack TypeScript application with:

- Modern Next.js architecture (App Router, Server Components)
- Type-safe GraphQL operations via code generation
- Comprehensive testing at all levels
- Enterprise authentication and authorization
- Robust monitoring and observability
- Clear separation of concerns

When working on this codebase, prioritize **type safety**, **backward compatibility**, and **security**. Follow established patterns, use existing helpers, and always test your changes.

Happy coding! 🚀
