// tests/specs/tasks.spec.ts
import { expect, ProjectsPage, TasksPage, test } from '../fixtures/fixtures';
import { ProjectData, TaskData } from '../fixtures/test-data';

test.describe('Tasks page — /tasks', () => {

  // Helper: ensure a project exists, return its name
  async function ensureProject(page: any): Promise<string> {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();
    const count = await projectsPage.getRowCount();
    const status = await projectsPage.rows.first().getByRole('cell').nth(2).innerText();
    if (count > 0 && !status.toLowerCase().includes('executed')) {
      const name = await projectsPage.rows.first().getByRole('cell').nth(1).innerText();
      return name.trim();
    }

    const projectName = `PW Helper Project ${Date.now()}`;
    const modal = await projectsPage.openCreateModal();
    await modal.fill({ name: projectName, deadline: ProjectData.valid.deadline });
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    return projectName;
  }

  // ── Page structure ─────────────────────────────────────────────────
  test('TK-01 tasks page loads at /tasks', async ({ tasksPage }) => {
    await expect(tasksPage.page).toHaveURL(/\/tasks/);
  });

  test('TK-02 New Task button is visible', async ({ tasksPage }) => {
    await expect(tasksPage.btnNewTask).toBeVisible();
  });

  test('TK-03 tasks table is visible', async ({ tasksPage }) => {
    await expect(tasksPage.taskTable).toBeVisible();
  });

  test('TK-04 table has correct columns', async ({ tasksPage }) => {

    const headers = ['Task Id', 'Task Name', 'Assignee', 'Priority', 'Status', 'Execution Date', 'Deadline', 'Project Title', 'Quick Actions'];

    for (const header of headers) {
      const headerLocator = await tasksPage.getTaskColumnHeader(header);
      await expect(headerLocator).toBeVisible();
    }
  });

  // ── Create Task modal — structure ──────────────────────────────────
  test('TK-05 Create Task modal opens', async ({ page }) => {
    const projectName = await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const modal = await tasksPage.openCreateModal();
    await expect(modal.container).toBeVisible();
  });

  test('TK-06 modal has Create Task header', async ({ page }) => {
    const projectName = await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const modal = await tasksPage.openCreateModal();
    await expect(
      modal.container.locator('[data-testid="modal-create-task-header"]')
        .or(modal.container.getByRole('heading'))
    ).toContainText(/create.*task/i);
  });

  test('TK-07 modal has Name field (required)', async ({ page }) => {
    await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const modal = await tasksPage.openCreateModal();
    await expect(modal.nameInput).toBeVisible();
  });

  test('TK-08 modal has Project field (required)', async ({ page }) => {
    await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const modal = await tasksPage.openCreateModal();
    await expect(modal.projectSelect).toBeVisible();
  });

  test('TK-09 Priority defaults to Low', async ({ page }) => {
    await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const modal = await tasksPage.openCreateModal();
    const priority = await modal.getPriorityValue();
    expect(priority.toLowerCase()).toContain('low');
  });

  test('TK-10 Status defaults to To Do', async ({ page }) => {
    await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const modal = await tasksPage.openCreateModal();
    const status = await modal.getStatusValue();
    expect(status.toLowerCase()).toMatch(/to do|todo/);
  });

  test('TK-11 modal has Cancel and Create Task buttons', async ({ page }) => {
    await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const modal = await tasksPage.openCreateModal();
    await expect(modal.btnCancel).toBeVisible();
    await expect(modal.btnCreate).toBeVisible();
  });

  // ── Create task — happy path ───────────────────────────────────────
  test('TK-12 valid task is created and appears in table', async ({ page }) => {
    const projectName = await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const before = await tasksPage.getRowCount();
    const taskName = `PW Task ${Date.now()}`;
    const modal = await tasksPage.openCreateModal();
    await modal.fill({ name: taskName, deadline: TaskData.valid.deadline });
    await modal.selectProject(projectName);
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    expect(await tasksPage.getRowCount()).toBe(before + 1);
    expect(await tasksPage.rowExists(taskName)).toBe(true);
  });

  test('TK-13 task created with High priority shows correct badge', async ({ page }) => {
    const projectName = await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const taskName = `PW High ${Date.now()}`;
    const modal = await tasksPage.openCreateModal();
    await modal.fill({ name: taskName, priority: 'High', deadline: TaskData.valid.deadline });
    await modal.selectProject(projectName);
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    const row = await tasksPage.getRowByName(taskName);
    const priority = await row.locator('td').nth(3).innerText(); // Assuming Priority is the 4th column
    expect(priority.toLowerCase()).toContain('high');
  });

  test('TK-14 Cancel closes modal without creating task', async ({ page }) => {
    await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const before = await tasksPage.getRowCount();
    const modal = await tasksPage.openCreateModal();
    await modal.fill({ name: `PW Cancel ${Date.now()}` });
    await modal.cancel();
    await expect(modal.container).toBeHidden();
    expect(await tasksPage.getRowCount()).toBe(before);
  });

  // ── Validation ────────────────────────────────────────────────────
  test('TK-15 empty name shows validation error', async ({ page }) => {
    await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const modal = await tasksPage.openCreateModal();
    await modal.fill({ name: '' });
    await modal.submit();
    await expect(modal.errorName).toBeVisible({ timeout: 6_000 });
    expect(await modal.isVisible()).toBe(true);
  });

  test('TK-16 missing project shows validation error', async ({ page }) => {
    await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const modal = await tasksPage.openCreateModal();
    await modal.fill({ name: 'Valid Task Name', deadline: TaskData.valid.deadline });
    // Do NOT select a project
    await modal.submit();
    await expect(modal.errorProject).toBeVisible({ timeout: 6_000 });
    expect(await modal.isVisible()).toBe(true);
  });

  // ── Row actions ───────────────────────────────────────────────────
  test('TK-17 task row has View, Complete, Edit, Delete buttons', async ({ page }) => {
    const projectName = await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const taskName = `PW Btns ${Date.now()}`;
    const modal = await tasksPage.openCreateModal();
    await modal.fill({ name: taskName, deadline: TaskData.valid.deadline });
    await modal.selectProject(projectName);
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });

    const row = await tasksPage.getRowByName(taskName);
    await expect(row.locator('[data-testid="task-action-view"]').or(row.getByRole('button', { name: /view/i }))).toBeVisible();
    await expect(row.locator('[data-testid="task-action-complete"]').or(row.getByRole('button', { name: /complete/i }))).toBeVisible();
    await expect(row.locator('[data-testid="task-action-edit"]').or(row.getByRole('button', { name: /edit/i }))).toBeVisible();
    await expect(row.locator('[data-testid="task-action-delete"]').or(row.getByRole('button', { name: /delete/i }))).toBeVisible();
  });

  test('TK-18 View button navigates to task detail', async ({ page }) => {
    const projectName = await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const taskName = `PW View ${Date.now()}`;
    const modal = await tasksPage.openCreateModal();
    await modal.fill({ name: taskName, deadline: TaskData.valid.deadline });
    await modal.selectProject(projectName);
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    await tasksPage.clickView(taskName);
    await expect(page).toHaveURL(/\/tasks\/\d+/);
  });

  test('TK-19 Complete marks task as Completed', async ({ page }) => {
    const projectName = await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const taskName = `PW Comp ${Date.now()}`;
    const modal = await tasksPage.openCreateModal();
    await modal.fill({ name: taskName, deadline: TaskData.valid.deadline });
    await modal.selectProject(projectName);
    await modal.submit();
    await tasksPage.quickWait(1000);
    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    await tasksPage.clickComplete(taskName);
    await modal.submit();
    await page.waitForLoadState('networkidle');
    const status = await tasksPage.getRowStatus(taskName);
    expect(status.toLowerCase()).toMatch(/completed|done/);
  });

  test('TK-20 Edit modal opens with project disabled', async ({ page }) => {
    const projectName = await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const taskName = `PW Edit ${Date.now()}`;
    const modal = await tasksPage.openCreateModal();
    await modal.fill({ name: taskName, deadline: TaskData.valid.deadline });
    await modal.selectProject(projectName);
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    const editModal = await tasksPage.clickEdit(taskName);
    await expect(editModal.container).toBeVisible();
    expect(await editModal.isProjectDisabled()).toBe(true);
  });

  test('TK-21 Delete removes task from table', async ({ page }) => {
    const projectName = await ensureProject(page);
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    const taskName = `PW Del ${Date.now()}`;
    const modal = await tasksPage.openCreateModal();
    await modal.fill({ name: taskName, deadline: TaskData.valid.deadline });
    await modal.selectProject(projectName);
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    const before = await tasksPage.getRowCount();
    await tasksPage.clickDelete(taskName);
    await tasksPage.confirmDialog();
    await page.waitForLoadState('networkidle');
    expect(await tasksPage.rowExists(taskName)).toBe(false);
  });

});
