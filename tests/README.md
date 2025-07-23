# E2E Tests for Developer Portal API

This project contains end-to-end tests for public API endpoints of Developer Portal.

## Project Structure

```
tests/
├── package.json              # Dependencies for e2e tests
├── jest.config.ts            # Jest configuration for e2e
├── jest.setup.ts             # Jest setup
├── tsconfig.json             # TypeScript configuration
├── .env.test                 # Environment variables for tests
├── global.d.ts               # Global types
├── helpers/                  # Helper functions
│   ├── index.ts              # Export all helpers
│   └── api-helpers.ts        # API request helpers
└── specs/                    # Test files
    └── public/               # Public endpoints tests
        └── public-apps.spec.ts
```

## Installation and Setup

1. **Install dependencies:**

   ```bash
   cd tests
   npm install
   ```

2. **Configure environment variables:**
   Create `.env.test` file with required variables:
   ```env
   API_BASE_URL=http://localhost:3000
   ```

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Run specific test

```bash
npm test -- --testNamePattern="should return list of public apps"
```

## Tested Endpoints

### GET /api/v2/public/apps

- Get list of public applications
- Validate response structure
- Check CORS headers

### GET /api/v2/public/app/[app_id]

- Get details of specific application
- Handle non-existent app_id (404)
- Validate data structure

### GET /api/v2/public/apps/search/[search_term]

- Search applications by term
- Handle empty results
- Handle special characters
- Handle empty search query

## Adding New Tests

1. Create new file in `specs/` folder
2. Import required helpers from `helpers/api-helpers.ts`
3. Write tests using Jest API

Example:

```typescript
import { getPublicApps } from "../helpers/api-helpers";

describe("New API Endpoint", () => {
  test("should work correctly", async () => {
    const response = await getPublicApps();
    expect(response.status).toBe(200);
  });
});
```

## Environment Variables

- `API_BASE_URL` - base URL for API requests (required)

## Troubleshooting

### Error "API_BASE_URL is not configured"

Make sure `.env.test` file exists and contains `API_BASE_URL` variable.

### TypeScript errors

Make sure all dependencies are installed:

```bash
npm install
```

### Tests not finding files

Check that test files are in `specs/` folder and have `.spec.ts` extension.
