// tests/pages/BasePage.ts
import { Locator, Page, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Wait for Betty Blocks network idle after action */
  async waitForBB() {
    await this.page.waitForLoadState('networkidle', { timeout: 20_000 });
  }

  /** Wait for BB action API response */
  async waitForActionResponse() {
    await this.page.waitForResponse(
      (res) =>
        (res.url().includes('/action') || res.url().includes('/api')) &&
        res.status() < 400,
      { timeout: 20_000 }
    ).catch(() => {
      // Fallback: wait for network idle if no matching response
    });
  }

  /** Resolve a locator using data-testid with ARIA fallback */
  resolve(testId: string, ariaFallback?: { role: string; name?: RegExp | string }) {
    const primary = this.page.locator(testId);
    if (ariaFallback) {
      return primary.or(
        this.page.getByRole(ariaFallback.role as any, { name: ariaFallback.name })
      );
    }
    return primary;
  }

  /** Fill a date picker — BB needs Tab to commit */
  async fillDate(locator: Locator, dateStr: string) {
    if (!dateStr) return;
    await locator.fill(dateStr);
    await locator.press('Tab');
  }

  /** Confirm a dialog if it appears */
  async confirmDialog() {
    await this.quickWait();
    const dialog = this.page
      .locator('[data-testid="confirm-yes"]')
      .or(this.page.getByRole('button', { name: /ok|confirm|yes/i }));
    await dialog.click();
    await this.quickWait(); // wait for dialog to process
    await dialog.isVisible().then(async (visible) => {
      if (visible) {
        await dialog.click();
      }
    });
    await this.quickWait(2000); // wait for dialog to process
  }

  /** Get inner text safely */
  async getText(locator: Locator): Promise<string> {
    try {
      return (await locator.innerText()).trim();
    } catch {
      return '';
    }
  }

  async quickWait(ms = 500) {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(ms);
  }

  async waitForCountGreaterThan(
    locator: Locator,
    minCount: number = 1,
    timeout: number = 10_000
  ) {
    await expect.poll(async () => {
      return await locator.count();
    }, {
      timeout
    }).toBeGreaterThan(minCount - 1);
  }

}
