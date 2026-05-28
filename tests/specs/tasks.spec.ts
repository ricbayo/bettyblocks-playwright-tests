import { expect, ProjectsPage, TasksPage, test } from '../fixtures/fixtures';
import { ProjectData, TaskData } from '../fixtures/test-data';

test.describe('Tasks page — /tasks', () => {

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
  // TEARDOWN (NEW)
  // ─────────────────────────────────────────────
  test.afterEach(async ({ page }) => {
    const tasksPage = new TasksPage(page);

    try {
      await tasksPage.goto();

      // optional cleanup safety
      const lastRow = await tasksPage.getRowCount();
      if (lastRow > 0) {
        // no-op safe cleanup pattern (best-effort)
      }
    } catch {
      // ignore
    }
  });

  test('TK-01 loads /tasks', async ({ tasksPage }) => {
    await expect(tasksPage.page).toHaveURL(/\/tasks$/);
  });

  test('TK-02 New Task button visible', async ({ tasksPage }) => {
    await expect(tasksPage.btnNewTask).toBeVisible();
  });

  test('TK-03 tasks table visible', async ({ tasksPage }) => {
    await expect(tasksPage.taskTable).toBeVisible();
  });

  test('TK-04 table columns visible', async ({ tasksPage }) => {
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

  test('TK-05 modal validation', async ({ page, tasksPage }) => {
    await ensureProject(page);
    await tasksPage.goto();

    const modal = await tasksPage.openCreateModal();

    await expect(modal.container).toBeVisible();

    expect((await modal.getPriorityValue()).toLowerCase()).toContain('low');
    expect((await modal.getStatusValue()).toLowerCase()).toMatch(/to do|todo/);

    await expect(modal.btnCancel).toBeVisible();
    await expect(modal.btnCreate).toBeVisible();
  });

  test('TK-06 task is created and appears in table', async ({ page, tasksPage }) => {
    const projectName = await ensureProject(page);
    await tasksPage.goto();

    const before = await tasksPage.getRowCount();
    const taskName = await createTask(tasksPage, projectName);

    await expect.poll(() => tasksPage.getRowCount()).toBe(before + 1);
    expect(await tasksPage.rowExists(taskName)).toBe(true);
  });

});