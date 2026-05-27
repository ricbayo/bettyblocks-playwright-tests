// tests/specs/tasks.spec.ts
import { expect, ProjectsPage, TasksPage, test } from '../fixtures/fixtures';
import { ProjectData, TaskData } from '../fixtures/test-data';

test.describe('Tasks page — /tasks', () => {

  // ─────────────────────────────────────────────
  // HELPERS (optimized)
  // ─────────────────────────────────────────────
  async function ensureProject(page: any): Promise<string> {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    const count = await projectsPage.getRowCount();

    if (count > 0) {
      const firstRow = projectsPage.rows.first();

      const status = await firstRow.getByRole('cell').nth(2).textContent();

      if (status && !status.toLowerCase().includes('executed')) {
        const name = await firstRow.getByRole('cell').nth(1).textContent();
        return name!.trim();
      }
    }

    const projectName = `PW Helper Project ${Date.now()}`;

    const modal = await projectsPage.openCreateModal();
    await modal.fill({
      name: projectName,
      deadline: ProjectData.valid.deadline,
    });

    await modal.submit();

    await expect(modal.container).toBeHidden({ timeout: 12_000 });

    return projectName;
  }

  async function createTask(tasksPage: TasksPage, projectName: string, overrides: any = {}) {
    const taskName = `PW Task ${Date.now()}`;

    const modal = await tasksPage.openCreateModal();

    await modal.fill({
      name: taskName,
      deadline: TaskData.valid.deadline,
      ...overrides,
    });

    await modal.selectProject(projectName);
    await modal.submit();

    await expect(modal.container).toBeHidden({ timeout: 12_000 });

    return taskName;
  }

  // ─────────────────────────────────────────────
  test('TK-01 tasks page loads at /tasks', async ({ tasksPage }) => {
    await expect(tasksPage.page).toHaveURL(/\/tasks/);
  });

  test('TK-02 New Task button is visible', async ({ tasksPage }) => {
    await expect(tasksPage.btnNewTask).toBeVisible();
  });

  test('TK-03 tasks table is visible', async ({ tasksPage }) => {
    await expect(tasksPage.taskTable).toBeVisible();
  });

  // ─────────────────────────────────────────────
  test('TK-04 table has correct columns', async ({ tasksPage }) => {
    const headers = [
      'Task Id',
      'Task Name',
      'Assignee',
      'Priority',
      'Status',
      'Execution Date',
      'Deadline',
      'Project Title',
      'Quick Actions',
    ];

    await expect(tasksPage.taskTable).toBeVisible();

    for (const header of headers) {
      await expect(await tasksPage.getTaskColumnHeader(header)).toBeVisible();
    }
  });

  // ─────────────────────────────────────────────
  test('TK-05 Create Task modal opens', async ({ page, tasksPage }) => {
    const projectName = await ensureProject(page);
    await tasksPage.goto();

    const modal = await tasksPage.openCreateModal();
    await expect(modal.container).toBeVisible();
  });

  test('TK-06 modal has Create Task header', async ({ page, tasksPage }) => {
    await ensureProject(page);
    await tasksPage.goto();

    const modal = await tasksPage.openCreateModal();

    await expect(
      modal.container.locator('[data-testid="modal-create-task-header"]')
        .or(modal.container.getByRole('heading'))
    ).toContainText(/create.*task/i);
  });

  test('TK-07 modal has Name field (required)', async ({ page, tasksPage }) => {
    await ensureProject(page);
    await tasksPage.goto();

    const modal = await tasksPage.openCreateModal();
    await expect(modal.nameInput).toBeVisible();
  });

  test('TK-08 modal has Project field (required)', async ({ page, tasksPage }) => {
    await ensureProject(page);
    await tasksPage.goto();

    const modal = await tasksPage.openCreateModal();
    await expect(modal.projectSelect).toBeVisible();
  });

  test('TK-09 Priority defaults to Low', async ({ page, tasksPage }) => {
    await ensureProject(page);
    await tasksPage.goto();

    const modal = await tasksPage.openCreateModal();
    expect((await modal.getPriorityValue()).toLowerCase()).toContain('low');
  });

  test('TK-10 Status defaults to To Do', async ({ page, tasksPage }) => {
    await ensureProject(page);
    await tasksPage.goto();

    const modal = await tasksPage.openCreateModal();
    expect((await modal.getStatusValue()).toLowerCase()).toMatch(/to do|todo/);
  });

  test('TK-11 modal has Cancel and Create Task buttons', async ({ page, tasksPage }) => {
    await ensureProject(page);
    await tasksPage.goto();

    const modal = await tasksPage.openCreateModal();

    await expect(modal.btnCancel).toBeVisible();
    await expect(modal.btnCreate).toBeVisible();
  });

  // ─────────────────────────────────────────────
  test('TK-12 valid task is created and appears in table', async ({ page, tasksPage }) => {
    const projectName = await ensureProject(page);
    await tasksPage.goto();

    const before = await tasksPage.getRowCount();

    const taskName = await createTask(tasksPage, projectName);

    await expect.poll(() => tasksPage.getRowCount())
      .toBe(before + 1);

    expect(await tasksPage.rowExists(taskName)).toBe(true);
  });

  test('TK-13 task created with High priority shows correct badge', async ({ page, tasksPage }) => {
    const projectName = await ensureProject(page);
    await tasksPage.goto();

    const taskName = await createTask(tasksPage, projectName, { priority: 'High' });

    const row = await tasksPage.getRowByName(taskName);
    const priority = await row.locator('td').nth(3).textContent();

    expect(priority?.toLowerCase()).toContain('high');
  });

  test('TK-14 Cancel closes modal without creating task', async ({ page, tasksPage }) => {
    await ensureProject(page);
    await tasksPage.goto();

    const before = await tasksPage.getRowCount();

    const modal = await tasksPage.openCreateModal();
    await modal.fill({ name: `PW Cancel ${Date.now()}` });
    await modal.cancel();

    await expect(modal.container).toBeHidden();

    expect(await tasksPage.getRowCount()).toBe(before);
  });

  // ─────────────────────────────────────────────
  test('TK-15 task row has View, Complete, Edit, Delete buttons', async ({ page, tasksPage }) => {
    const projectName = await ensureProject(page);
    await tasksPage.goto();

    const taskName = await createTask(tasksPage, projectName);

    const row = await tasksPage.getRowByName(taskName);

    await expect(await tasksPage.getviewBtn(taskName)).toBeVisible();
    await expect(await tasksPage.getcompleteBtn(taskName)).toBeVisible();
    await expect(await tasksPage.geteditBtn(taskName)).toBeVisible();
    await expect(await tasksPage.getdeleteBtn(taskName)).toBeVisible();
  });

  test('TK-16 View button navigates to task detail', async ({ page, tasksPage }) => {
    const projectName = await ensureProject(page);
    await tasksPage.goto();

    const taskName = await createTask(tasksPage, projectName);

    await tasksPage.clickView(taskName);
    await expect(page).toHaveURL(/\/tasks\/\d+/);
  });

  test('TK-17 Complete marks task as Completed', async ({ page, tasksPage }) => {
    const projectName = await ensureProject(page);
    await tasksPage.goto();

    const taskName = await createTask(tasksPage, projectName);

    await tasksPage.clickComplete(taskName);

    const status = await tasksPage.getRowStatus(taskName);
    expect(status.toLowerCase()).toMatch(/completed|done/);
  });

  test('TK-18 Edit modal opens with project disabled', async ({ page, tasksPage }) => {
    const projectName = await ensureProject(page);
    await tasksPage.goto();

    const taskName = await createTask(tasksPage, projectName);

    const editModal = await tasksPage.clickEdit(taskName);

    await expect(editModal.container).toBeVisible();
    expect(await editModal.isProjectDisabled()).toBe(true);
  });

  test('TK-19 Delete removes task from table', async ({ page, tasksPage }) => {
    const projectName = await ensureProject(page);
    await tasksPage.goto();

    const taskName = await createTask(tasksPage, projectName);

    await tasksPage.clickDelete(taskName);

    await expect.poll(() => tasksPage.rowExists(taskName)).toBe(false);
  });

});