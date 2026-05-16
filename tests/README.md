# MotoFlow Testing Guide

## Overview

This directory contains tests for the MotoFlow application using Vitest (unit/integration) and Playwright (E2E).

## Test Structure

```
tests/
├── unit/           # Unit tests for individual functions/modules
├── integration/    # Integration tests for API endpoints and workflows
├── e2e/            # End-to-end tests for complete user journeys
└── setup.ts        # Test setup and configuration
```

## Running Tests

### Vitest (Unit + Integration Tests)

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Playwright (E2E Tests)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in specific browser
npx playwright test --project=chromium
```

## Coverage Goals

- **Repositories**: 60%+ coverage
- **API Endpoints**: 40%+ coverage
- **Critical User Flows**: All covered by E2E tests

## Test Categories

### Unit Tests (`tests/unit/`)

Test individual functions and modules in isolation:

- **orderStateMachine.test.ts** - Order status state machine validation
- More to come...

### Integration Tests (`tests/integration/`)

Test multiple components working together:

- **orderStatus.test.ts** - Order status workflow integration
- More to come...

### E2E Tests (`tests/e2e/`)

Test complete user journeys through the application:

- **order-flow.spec.ts** - Order creation, driver acceptance, and status progression
- More to come...

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/myModule';

describe('My Function', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { repository } from '@/lib/db/repositories/MyRepository';

describe('My Repository Integration', () => {
  it('should create and retrieve data', async () => {
    const created = await repository.create({ name: 'Test' });
    const found = await repository.findById(created.id);
    expect(found?.name).toBe('Test');
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/app/dashboard');
});
```

## Important Notes

- **Authentication**: E2E tests will need proper authentication setup (TODO)
- **Database**: Consider using a test database for integration tests
- **Cleanup**: Ensure tests clean up any data they create
- **Test Data**: Use consistent, predictable test data
- **Flaky Tests**: Use proper waiting and assertions to avoid flakiness

## Coverage Reports

Coverage reports are generated in `coverage/` directory after running:

```bash
npm run test:coverage
```

Open `coverage/index.html` in a browser to view the full report.

## Troubleshooting

### Vitest Issues

- **Import errors**: Check `vitest.config.ts` for path aliases
- **Timeout errors**: Increase timeout in test config or add explicit waits
- **DOM errors**: Ensure `jsdom` environment is properly configured

### Playwright Issues

- **Browser not found**: Run `npx playwright install` to install browsers
- **Timeout errors**: Increase timeout in test or config
- **Element not found**: Use proper waiting strategies (`waitForSelector`)

## Next Steps

- [ ] Add authentication helpers for E2E tests
- [ ] Set up test database for integration tests
- [ ] Add more unit tests for repositories
- [ ] Add API integration tests
- [ ] Expand E2E test coverage for all critical flows
