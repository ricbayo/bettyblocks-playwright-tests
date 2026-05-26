// tests/specs/dashboard.spec.ts
import { expect, test } from '../fixtures/fixtures';

test.describe('Dashboard — /home', () => {

  // ── Page loads ────────────────────────────────────────────────────
  test('DB-01 dashboard page loads at /home', async ({ dashboardPage }) => {
    await expect(dashboardPage.page).toHaveURL(/\/home/);
  });

  // ── KPI cards ─────────────────────────────────────────────────────
  test('DB-02 Total Projects KPI card is visible', async ({ dashboardPage }) => {
    await expect(dashboardPage.kpiTotalProjects).toBeVisible();
  });

  test('DB-03 Open Tasks KPI card is visible', async ({ dashboardPage }) => {
    await expect(dashboardPage.kpiOpenTasks).toBeVisible();
  });

  test('DB-04 Overdue Tasks KPI card is visible', async ({ dashboardPage }) => {
    await expect(dashboardPage.kpiOverdueTasks).toBeVisible();
  });

  test('DB-05 High Priority KPI card is visible', async ({ dashboardPage }) => {
    await expect(dashboardPage.kpiHighPriority).toBeVisible();
  });

  test('DB-06 KPI cards display numeric values', async ({ dashboardPage }) => {
    for (const kpi of [
      dashboardPage.kpiTotalProjects,
      dashboardPage.kpiOpenTasks,
      dashboardPage.kpiOverdueTasks,
      dashboardPage.kpiHighPriority,
    ]) {
      const text = await dashboardPage.getKpiValue(kpi);
      // Should contain at least one digit
      expect(text).toMatch(/\d/);
    }
  });

  // ── Priority tasks table ───────────────────────────────────────────
  test('DB-07 Priority tasks table is visible', async ({ dashboardPage }) => {
    await expect(dashboardPage.priorityTable).toBeVisible();
  });

  test('DB-08 Priority table has correct column headers', async ({ dashboardPage }) => {
    const headers = [
      'Task Name',
      'Assignee',
      'Priority',
      'Deadline',
      'Status',
      'Project Title',
      'Quick Actions'
    ];

    const headerCells = dashboardPage.page.locator('table tbody tr').first().locator('td');

    for (const text of headers) {
      await expect(
        headerCells.filter({ hasText: text }).first()
      ).toBeVisible();
    }
  });

  test('DB-09 Priority table rows contain task name', async ({ dashboardPage }) => {
    const count = await dashboardPage.priorityRows.count();
    if (count === 0) {
      test.skip(true, 'No priority tasks available to test row content');
      return;
    }
    const firstRow = dashboardPage.priorityRows.first();
    const text = await firstRow.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('DB-10 Priority table rows have View action button', async ({ dashboardPage }) => {
    const count = await dashboardPage.priorityRows.count();
    if (count === 0) {
      test.skip(true, 'No priority tasks to test actions');
      return;
    }
    const firstRow = dashboardPage.page.locator('table tbody tr').nth(1);
    await expect(
      firstRow.locator('[data-testid="priority-action-view"]')
        .or(firstRow.getByRole('button', { name: /view/i }))
    ).toBeVisible();
  });

  test('DB-11 Priority table rows have Close action button', async ({ dashboardPage }) => {
    const count = await dashboardPage.priorityRows.count();
    if (count === 0) {
      test.skip(true, 'No priority tasks to test actions');
      return;
    }
    const firstRow = dashboardPage.page.locator('table tbody tr').nth(1);
    await expect(
      firstRow.locator('[data-testid="priority-action-close"]')
        .or(firstRow.getByRole('button', { name: /close/i }))
    ).toBeVisible();
  });

  test('DB-12 clicking View on priority row navigates to task detail', async ({ page, dashboardPage }) => {
    const count = await dashboardPage.priorityRows.count();
    if (count === 0) {
      test.skip(true, 'No priority tasks available');
      return;
    }
    const firstRow = dashboardPage.priorityRows.nth(1);
    await dashboardPage.clickViewOnRow(firstRow);
    await expect(page).toHaveURL(/\/tasks\/\d+/, { timeout: 15_000 });
  });

});
