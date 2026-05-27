import {
  expect,
  ProjectsPage,
  TaskDetailPage,
  TasksPage,
  test,
} from '../fixtures/fixtures';

import { ProjectData, TaskData } from '../fixtures/test-data';

test.describe('Task Detail page — /tasks/:id', () => {
  let taskName: string;
  let taskId: string;
  let detail: TaskDetailPage;

  test.beforeEach(async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    let projectName: string;

    const hasProjects = await projectsPage.rows.count() > 0;

    if (hasProjects) {
      const firstRow = projectsPage.rows.first();
      const status = (await firstRow.getByRole('cell').nth(2).textContent()) ?? '';

      if (!status.toLowerCase().includes('executed')) {
        projectName =
          (
            await firstRow
              .locator('[data-testid="project-col-name"]')
              .or(firstRow.getByRole('cell').nth(1))
              .textContent()
          )?.trim() ?? '';
      } else {
        projectName = await createProject(projectsPage);
      }
    } else {
      projectName = await createProject(projectsPage);
    }

    const tasksPage = new TasksPage(page);
    await tasksPage.goto();

    taskName = `PW Detail Task ${Date.now()}`;

    const users = ['Jip', 'RIC FRANCIS BAYO'];
    const userName = users[Math.floor(Math.random() * users.length)];

    const modal = await tasksPage.openCreateModal();

    await modal.fill({
      name: taskName,
      description: 'Detail test description',
      priority: 'High',
      executionDate: TaskData.valid.executionDate,
      deadline: TaskData.valid.deadline,
    });

    await modal.selectProject(projectName);
    await modal.selectAssignee(userName);
    await modal.submit();

    await expect(modal.container).toBeHidden({ timeout: 12_000 });

    await tasksPage.clickView(taskName);
    await expect(page).toHaveURL(/\/tasks\/\d+/);

    taskId = page.url().split('/tasks/')[1];
    detail = new TaskDetailPage(page);
  });

  // ─────────────────────────────────────────────
  // Page structure
  // ─────────────────────────────────────────────

  test('TD-01 task detail page loads at correct URL', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(`/tasks/${taskId}`));
  });

  test('TD-02 Back button visible', async () => {
    await expect(detail.backBtn).toBeVisible();
  });

  test('TD-03 Edit button visible', async () => {
    await expect(detail.btnEdit).toBeVisible();
  });

  test('TD-04 Complete button visible', async () => {
    await expect(detail.btnComplete).toBeVisible();
  });

  test('TD-05 Delete button visible', async () => {
    await expect(detail.btnDelete).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // Header
  // ─────────────────────────────────────────────

  test('TD-06 header shows task name', async () => {
    await expect(detail.headerName).toBeVisible();
    await expect(detail.headerName).toContainText(taskName);
  });

  test('TD-07 header shows priority', async () => {
    await expect(detail.headerPriority).toBeVisible();
    await expect(detail.headerPriority).toContainText(/high/i);
  });

  test('TD-08 header shows status', async () => {
    await expect(detail.headerStatus).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // Details
  // ─────────────────────────────────────────────

  test('TD-09 shows description', async () => {
    await expect(detail.description).toContainText('Detail test description');
  });

  test('TD-10 project link visible', async () => {
    await expect(detail.project).toBeVisible();
    await expect(detail.project).toHaveAttribute('href', /\/projects\/\d+/);
  });

  test('TD-11 project link navigates', async ({ page }) => {
    await detail.project.click();
    await expect(page).toHaveURL(/\/projects\/\d+/);
  });

  test('TD-12 assigned to is visible', async () => {
    await expect(detail.assignedTo).toBeVisible();
  });

  test('TD-13 execution date visible', async () => {
    await expect(detail.executionDate).toBeVisible();
  });

  test('TD-14 deadline visible', async () => {
    await expect(detail.deadline).toBeVisible();
  });

  test('TD-15 created date visible', async () => {
    await expect(detail.createdDate).toBeVisible();
  });

  test('TD-16 completedAt hidden initially', async () => {
    if (await detail.completedAt.count()) {
      await expect(detail.completedAt).toBeHidden();
    }
  });

  // ─────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────

  test('TD-17 back navigates to tasks', async ({ page }) => {
    await detail.clickBack();
    await expect(page).toHaveURL(/\/tasks$/);
  });

  // ─────────────────────────────────────────────
  // Complete
  // ─────────────────────────────────────────────

  test('TD-18 completes task', async () => {
    await detail.complete();
    await expect(detail.headerStatus).toContainText(/completed|done/i);
  });

  test('TD-19 complete button hides', async () => {
    await detail.complete();
    await expect(detail.btnComplete).toBeHidden();
  });

  test('TD-20 completedAt appears', async () => {
    await detail.complete();
    await expect(detail.completedAt).toBeVisible({ timeout: 8000 });
  });

  // ─────────────────────────────────────────────
  // Edit
  // ─────────────────────────────────────────────

  test('TD-21 edit modal opens', async () => {
    const modal = await detail.openEditModal();
    await expect(modal.container).toBeVisible();
  });

  test('TD-22 project field disabled', async () => {
    const modal = await detail.openEditModal();
    expect(await modal.isProjectDisabled()).toBe(true);
  });

  test('TD-23 edit updates header', async ({ page }) => {
    const updated = `PW Updated ${Date.now()}`;

    const modal = await detail.openEditModal();
    await modal.nameInput.fill(updated);
    await modal.submit();

    await expect(modal.container).toBeHidden();
    await expect(detail.headerName).toContainText(updated);
  });

  // ─────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────

  test('TD-24 delete returns to tasks', async ({ page }) => {
    await detail.delete();
    await expect(page).toHaveURL(/\/tasks$/);
  });

  test('TD-25 task removed from list', async ({ page }) => {
    await detail.delete();

    const tasksPage = new TasksPage(page);
    await expect.poll(async () =>
      tasksPage.rowExists(taskName)
    ).toBe(false);
  });
});

// ─────────────────────────────────────────────
// helper
// ─────────────────────────────────────────────

async function createProject(projectsPage: ProjectsPage): Promise<string> {
  const name = `PW Project ${Date.now()}`;
  const modal = await projectsPage.openCreateModal();

  await modal.fill({
    name,
    deadline: ProjectData.valid.deadline,
  });

  await modal.submit();
  return name;
}