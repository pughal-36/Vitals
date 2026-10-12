import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const TEST_SCAN_ID = '353b87a5-9081-4dfa-acd8-042d1873837b';
const supabaseUrl = process.env.NEXT_PUBLIC_VITALS_SUPABASE_URL || process.env.VITALS_SUPABASE_URL;
const supabaseAnonKey = process.env.VITALS_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_VITALS_SUPABASE_ANON_KEY;

test.describe('Primary Vitals Audit and Assistant Flow', () => {
  test.beforeAll(async () => {
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error } = await supabase.from('scans').insert({
        id: TEST_SCAN_ID,
        url: 'https://example.com',
        strategy: 'mobile',
        status: 'done',
        score_performance: 95,
        score_accessibility: 90,
        score_best_practices: 85,
        score_seo: 100,
        raw_categories: { categories: {}, failingAudits: [] },
      });
      if (error && error.code !== '23505') {
        console.warn('[beforeAll] test scan insert notice:', error.message);
      }
    }
  });

  test.afterAll(async () => {
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.from('scans').delete().eq('id', TEST_SCAN_ID);
    }
  });
  test('submits a URL for audit, navigates to assistant, and receives AI chat response', async ({ page }) => {
    // Intercept scan API to return deterministic scan data
    await page.route('**/api/scan**', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            id: '353b87a5-9081-4dfa-acd8-042d1873837b',
            status: 'done',
            cached: false,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            scan: {
              id: '353b87a5-9081-4dfa-acd8-042d1873837b',
              url: 'https://example.com',
              status: 'done',
              score_performance: 95,
              score_accessibility: 90,
              score_best_practices: 85,
              score_seo: 100,
              created_at: new Date().toISOString(),
              raw_categories: { categories: {}, failingAudits: [] },
            },
          }),
        });
      }
    });

    // Also support fallback intercept on /api/audit
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
    await expect(page.getByRole('heading', { name: /audit your site'?s web vitals/i })).toBeVisible();
    await expect(page.locator('.globe-panel')).toBeVisible();

    // 2. Submit URL for audit in the form
    const urlInput = page.getByRole('textbox', { name: /website url to audit/i });
    await urlInput.fill('https://example.com');
    await page.getByRole('button', { name: /scan/i }).click();

    // 3. Wait for the scan ID to be mirrored to the landing URL
    await expect(page).toHaveURL(/\?scan=353b87a5-9081-4dfa-acd8-042d1873837b/, { timeout: 20000 });

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
      page.getByRole('log', { name: 'Audit assistant conversation' }).getByText(
        'Great job! Your performance score is 95. Optimize images to maintain fast load times.'
      )
    ).toBeVisible({ timeout: 15000 });
  });

  test('gracefully degrades when scan is not found', async ({ page }) => {
    await page.goto('/assistant/non-existent-scan-id');
    await expect(page.getByRole('heading', { name: /scan not found/i })).toBeVisible();
    await expect(page.getByText(/could not be found or has expired/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /back to audit/i })).toBeVisible();
  });
});

