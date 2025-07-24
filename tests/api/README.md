# E2E Tests for Developer Portal API

This project contains end-to-end tests for public API endpoints of Developer Portal.

## Project Structure

```
tests/
├── package.json              # Dependencies for e2e tests
├── jest.config.ts            # Jest configuration for e2e
├── jest.setup.ts             # Jest setup
├── tsconfig.json             # TypeScript configuration
├── .env.development          # Environment variables for tests
├── global.d.ts               # Global types
└── specs/                    # Test files
    └── public/               # Public endpoints tests
        └── public-apps.spec.ts
```

## Installation and Setup

1. **Install dependencies:**

   ```bash
   cd tests
   pnpm install
   ```

2. **Configure environment variables:**
   Create `.env.development` file with required variables:
   ```env
   API_BASE_URL=http://localhost:3000
   ```

## Running Tests

### Run all tests

```bash
pnpm test
```

### Run tests in watch mode

```bash
pnpm run test:watch
```

### Run tests with coverage

```bash
pnpm run test:coverage
```

### Run specific test

```bash
pnpm test -- --testNamePattern="should return list of public apps"
```

## Tested Endpoints

### GET /api/v2/public/apps

- Get list of public applications with rankings and categories
- Validate response structure with app_rankings, all_category, and categories
- Check response headers

### GET /api/v2/public/app/[app_id]

- Get details of specific application using app_id from apps list
- Handle non-existent app_id (404)
- Validate app_data structure with description object

### GET /api/v2/public/apps/search/[search_term]

- Search applications by term
- Return app_ids array for matching results
- Handle empty results for non-matching terms

## Adding New Tests

1. Create new file in `specs/` folder
2. Import axios and use direct API calls
3. Write tests using Jest API

Example:

```typescript
import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL;

describe("New API Endpoint", () => {
  test("should work correctly", async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v2/public/apps`);
    expect(response.status).toBe(200);
  });
});
```

## Environment Variables

- `API_BASE_URL` - base URL for API requests (required)

## Troubleshooting

### Error "API_BASE_URL is not configured"

Make sure `.env.development` file exists and contains `API_BASE_URL` variable.

### TypeScript errors

Make sure all dependencies are installed:

```bash
pnpm install
```

### Tests not finding files

Check that test files are in `specs/` folder and have `.spec.ts` extension.
