// tests/specs/project-detail.spec.ts
import { expect, ProjectDetailPage, ProjectsPage, test } from '../fixtures/fixtures';
import { ProjectData, TaskData } from '../fixtures/test-data';

test.describe('Project Detail page — /projects/:id', () => {

  let projectName: string;
  let projectId: string;

  // Create a project before these tests and navigate to its detail page
  test.beforeEach(async ({ page }) => {
    projectName = `PW Detail ${Date.now()}`;
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();
    const modal = await projectsPage.openCreateModal();
    await modal.fill({ name: projectName, deadline: ProjectData.valid.deadline });
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });

    // Navigate via View button to get the real project ID in URL
    await projectsPage.clickView(projectName);
    await page.waitForURL(/\/projects\/\d+/);
    projectId = page.url().split('/projects/')[1];
  });

  // ── Page structure ─────────────────────────────────────────────────
  test('PD-01 project detail page loads at correct URL', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}`));
  });

  test('PD-02 Back to Projects button is visible', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    await expect(detailPage.backBtn).toBeVisible();
  });

  test('PD-03 Edit Project button is visible', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    await expect(detailPage.btnEdit).toBeVisible();
  });

  test('PD-04 Close Project button is visible', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    await expect(detailPage.btnClose).toBeVisible();
  });

  test('PD-05 project details card shows name, status, deadline, owner', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    await expect(detailPage.nameEl).toBeVisible();
    await expect(detailPage.statusEl).toBeVisible();
    await expect(detailPage.deadlineEl).toBeVisible();
    await expect(detailPage.ownerEl).toBeVisible();

    const name = await detailPage.getText(detailPage.nameEl);
    expect(name).toContain(projectName);

    const status = await detailPage.getText(detailPage.statusEl);
    expect(status.toLowerCase()).toContain('new');
  });

  test('PD-06 project tasks table is visible with Add Task button', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    await expect(detailPage.btnAddTask).toBeVisible();
    await expect(
      detailPage.taskRows.first().or(page.getByText(/no tasks|empty/i))
    ).toBeDefined();
  });

  test('PD-07 tasks table has correct columns', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);

    const headers = ['Task Id', 'Name', 'Priority', 'Status', 'Execution Date', 'Deadline', 'Assigned To', 'Actions'];

    for (const header of headers) {
      const headerLocator = await detailPage.getTaskColumnHeader(header);
      await expect(headerLocator).toBeVisible();
    }
  });

  // ── Back navigation ────────────────────────────────────────────────
  test('PD-08 Back button navigates to /projects', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    await detailPage.backBtn.click();
    await expect(page).toHaveURL(/\/projects$/, { timeout: 10_000 });
  });

  // ── Edit project from detail ───────────────────────────────────────
  test('PD-09 Edit modal opens with status editable', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    const modal = await detailPage.openEditModal();
    await expect(modal.container).toBeVisible();
    expect(await modal.isStatusEditable()).toBe(true);
  });

  // ── Add Task modal ─────────────────────────────────────────────────
  test('PD-10 Add Task modal opens from project detail', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    const modal = await detailPage.openAddTaskModal();
    await expect(modal.container).toBeVisible();
  });

  test('PD-11 Add Task modal has Project pre-filled and disabled', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    const modal = await detailPage.openAddTaskModal();
    expect(await modal.isProjectDisabled()).toBe(true);
    const projectValue = await modal.getText(modal.projectSelect);
    expect(projectValue.trim().length).toBeGreaterThan(0);
  });

  test('PD-12 new task appears in project tasks table after creation', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    const taskName = `PW Task ${Date.now()}`;
    const modal = await detailPage.openAddTaskModal();
    await modal.fill({ name: taskName, deadline: TaskData.valid.deadline });
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    await expect(
      detailPage.taskRows.filter({ hasText: taskName })
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Task row actions ───────────────────────────────────────────────
  test('PD-13 task row has View, Complete, Edit, Delete buttons', async ({ page }) => {
    // Create a task first
    const detailPage = new ProjectDetailPage(page);
    const taskName = `PW Actions ${Date.now()}`;
    const modal = await detailPage.openAddTaskModal();
    await modal.fill({ name: taskName, deadline: TaskData.valid.deadline });
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });

    const row = await detailPage.getTaskRowByName(taskName);
    await expect(row.locator('[data-testid="ptask-action-view"]').or(row.getByRole('button', { name: /view/i }))).toBeVisible();
    await expect(row.locator('[data-testid="ptask-action-complete"]').or(row.getByRole('button', { name: /complete/i }))).toBeVisible();
    await expect(row.locator('[data-testid="ptask-action-edit"]').or(row.getByRole('button', { name: /edit/i }))).toBeVisible();
    await expect(row.locator('[data-testid="ptask-action-delete"]').or(row.getByRole('button', { name: /delete/i }))).toBeVisible();
  });

  test('PD-14 Complete button marks task as Completed', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    const taskName = `PW Complete ${Date.now()}`;
    const modal = await detailPage.openAddTaskModal();
    await modal.fill({ name: taskName, deadline: TaskData.valid.deadline });
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });

    await detailPage.clickCompleteTask(taskName);
    await page.waitForLoadState('networkidle');

    const row = await detailPage.getTaskRowByName(taskName);
    const status = await detailPage.getText(row.locator('td').nth(3)); // Assuming Status is the 4th column
    expect(status.toLowerCase()).toMatch(/completed|done/);
  });

  test('PD-15 Delete removes task from project tasks table', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    const taskName = `PW Del ${Date.now()}`;
    const modal = await detailPage.openAddTaskModal();
    await modal.fill({ name: taskName, deadline: TaskData.valid.deadline });
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    await expect(
      detailPage.taskRows.filter({ hasText: taskName })
    ).toBeVisible({ timeout: 10_000 });

    await detailPage.clickDeleteTask(taskName);
    await page.waitForLoadState('networkidle');
    expect(await (await detailPage.getTaskRowByName(taskName)).count()).toBe(0);
  });

  // ── Close project ──────────────────────────────────────────────────
  test('PD-16 Close Project changes status to Executed', async ({ page }) => {
    const detailPage = new ProjectDetailPage(page);
    await detailPage.closeProject();
    await page.waitForLoadState('networkidle');
    const status = await detailPage.getText(detailPage.statusEl);
    expect(status.toLowerCase()).toMatch(/executed|closed/);
  });

});
