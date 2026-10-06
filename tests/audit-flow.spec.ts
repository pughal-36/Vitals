import { test, expect } from '@playwright/test';

test.describe('Primary Vitals Audit and Assistant Flow', () => {
  test('submits a URL for audit, navigates to assistant, and receives AI chat response', async ({ page }) => {
    // Intercept audit API to return deterministic scan data
    await page.route('**/api/audit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          id: '353b87a5-9081-4dfa-acd8-042d1873837b',
          url: 'https://example.com',
          fetchedAt: new Date().toISOString(),
          scores: {
            performance: 95,
            accessibility: 90,
            bestPractices: 85,
            seo: 100,
          },
          raw: {
            categories: {},
            failingAudits: [],
          },
        }),
      });
    });

    // Intercept AI chat API with simulated SSE UI message streaming response
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'x-vercel-ai-ui-message-stream': 'v1',
        },
        body: [
          'data: {"type":"text-start","id":"text-1"}',
          'data: {"type":"text-delta","id":"text-1","delta":"Great job! Your performance score is 95. Optimize images to maintain fast load times."}',
          'data: {"type":"text-end","id":"text-1"}',
          'data: [DONE]',
          '',
          '',
        ].join('\n\n'),
      });
    });

    // 1. Visit the home page
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /audit your site.*web vitals/i })).toBeVisible();

    // 2. Submit URL for audit in the form
    const urlInput = page.getByRole('textbox', { name: /website url to audit/i });
    await urlInput.fill('https://example.com');
    await page.getByRole('button', { name: /scan/i }).click();

    // 3. Wait for client-side navigation to the audit page (allow time for initial dev compilation)
    await expect(page).toHaveURL(/\/audit\/353b87a5-9081-4dfa-acd8-042d1873837b/, { timeout: 20000 });

    // 4. Navigate to the Assistant chat tab
    const assistantLink = page.getByRole('link', { name: 'ASSISTANT' });
    await assistantLink.click();
    await expect(page).toHaveURL(/\/assistant\/353b87a5-9081-4dfa-acd8-042d1873837b/, { timeout: 20000 });

    // 5. Verify chat input is available and send a message
    const chatInput = page.getByPlaceholder('Ask about web performance…');
    await expect(chatInput).toBeVisible();
    await chatInput.fill('How can I optimize my score?');
    await page.getByRole('button', { name: /send/i }).click();

    // 6. Verify the AI response rendered deterministically
    await expect(
      page.getByText('Great job! Your performance score is 95. Optimize images to maintain fast load times.')
    ).toBeVisible({ timeout: 15000 });
  });
});
