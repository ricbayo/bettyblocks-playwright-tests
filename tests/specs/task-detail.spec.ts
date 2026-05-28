// tests/specs/task-detail.spec.ts
import { expect, ProjectsPage, TaskDetailPage, TasksPage, test } from '../fixtures/fixtures';
import { ProjectData, TaskData } from '../fixtures/test-data';

test.describe('Task Detail page — /tasks/:id', () => {
  let taskName: string;
  let taskId: string;
  let projectName: string;

  test.beforeEach(async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    const count = await projectsPage.getRowCount();
    const status = await projectsPage.rows.first().getByRole('cell').nth(2).innerText();

    if (count > 0 && !status.toLowerCase().includes('executed')) {
      projectName = (await projectsPage.rows.first()
        .locator('[data-testid="project-col-name"]')
        .or(projectsPage.rows.first().getByRole('cell').nth(1))
        .innerText()).trim();
    } else {
      projectName = `PW Project ${Date.now()}`;
      const pModal = await projectsPage.openCreateModal();
      await pModal.fill({ name: projectName, deadline: ProjectData.valid.deadline });
      await pModal.submit();
      await expect(pModal.container).toBeHidden({ timeout: 12_000 });
    }

    const tasksPage = new TasksPage(page);
    await tasksPage.goto();

    taskName = `PW Detail Task ${Date.now()}`;

    const users = ['Jip', 'RIC FRANCIS BAYO'];
    const userName = users[Math.floor(Math.random() * users.length)];

    const tModal = await tasksPage.openCreateModal();
    await tModal.fill({
      name: taskName,
      description: 'Detail test description',
      priority: 'High',
      executionDate: TaskData.valid.executionDate,
      deadline: TaskData.valid.deadline,
    });

    await tModal.selectProject(projectName);
    await tModal.selectAssignee(userName);
    await tModal.submit();

    await expect(tModal.container).toBeHidden({ timeout: 12_000 });

    await tasksPage.clickView(taskName);
    await expect(page).toHaveURL(/\/tasks\/\d+/);

    taskId = page.url().split('/tasks/')[1];
  });

  // ─────────────────────────────────────────────
  // TD-01 Page load
  // ─────────────────────────────────────────────
  test('TD-01 task detail page loads at correct URL', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(`/tasks/${taskId}$`));
  });

  // ─────────────────────────────────────────────
  // TD-02 Action buttons visibility
  // ─────────────────────────────────────────────
  test('TD-02 action buttons are visible', async ({ page }) => {
    const detail = new TaskDetailPage(page);

    await expect(detail.backBtn).toBeVisible();
    await expect(detail.btnEdit).toBeVisible();
    await expect(detail.btnComplete).toBeVisible();
    await expect(detail.btnDelete).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TD-03 Header details
  // ─────────────────────────────────────────────
  test('TD-03 header shows correct details', async ({ page }) => {
    const detail = new TaskDetailPage(page);

    await expect(detail.headerName).toBeVisible();
    await expect(detail.headerName).toContainText(taskName);
    await expect(detail.headerPriority).toContainText(/high/i);
    await expect(detail.headerStatus).toContainText(/todo|to do|in progress/i);
  });

  // ─────────────────────────────────────────────
  // TD-04 Description
  // ─────────────────────────────────────────────
  test('TD-04 description visible', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.description).toContainText('Detail test description');
  });

  // ─────────────────────────────────────────────
  // TD-05 Project link behavior
  // ─────────────────────────────────────────────
  test('TD-05 project link behavior', async ({ page }) => {
    const detail = new TaskDetailPage(page);

    await expect(detail.project).toHaveAttribute('href', /\/projects\/\d+/);

    await detail.project.click();
    await expect(page).toHaveURL(/\/projects\/\d+/);
  });

  // ─────────────────────────────────────────────
  // TD-06 Assigned user
  // ─────────────────────────────────────────────
  test('TD-06 assigned user visible', async ({ page }) => {
    await expect(new TaskDetailPage(page).assignedTo).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TD-07 Metadata fields
  // ─────────────────────────────────────────────
  test('TD-07 metadata fields visible', async ({ page }) => {
    const detail = new TaskDetailPage(page);

    await expect(detail.executionDate).toBeVisible();
    await expect(detail.deadline).toBeVisible();
    await expect(detail.createdDate).toBeVisible();
  });

  // ─────────────────────────────────────────────
  // TD-08 CompletedAt hidden
  // ─────────────────────────────────────────────
  // test('TD-08 completedAt hidden for open task', async ({ page }) => {
  //   const detail = new TaskDetailPage(page);

  //   const completedAt =
  //     detail.completedAt ??
  //     page.locator('[data-testid="task-detail-completed-at"]');

  //   await expect(completedAt).toHaveCount(0);
  // });

  // ─────────────────────────────────────────────
  // TD-09 Back navigation
  // ─────────────────────────────────────────────
  test('TD-09 back navigates to /tasks', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await detail.clickBack();
    await expect(page).toHaveURL(/\/tasks$/);
  });

  // ─────────────────────────────────────────────
  // TD-10 Complete flow
  // ─────────────────────────────────────────────
  test('TD-10 complete task flow', async ({ page }) => {
    const detail = new TaskDetailPage(page);

    await detail.complete();

    await expect(detail.headerStatus).toContainText(/completed|done/i);
    await expect(detail.btnComplete).toBeHidden();
  });

  // ─────────────────────────────────────────────
  // TD-11 Edit flow
  // ─────────────────────────────────────────────
  test('TD-11 edit task flow', async ({ page }) => {
    const detail = new TaskDetailPage(page);

    const modal = await detail.openEditModal();

    await expect(modal.container).toBeVisible();
    expect(await modal.isProjectDisabled()).toBe(true);

    const updated = `PW Updated ${Date.now()}`;

    await modal.nameInput.fill(updated);
    await modal.submit();

    await expect(modal.container).toBeHidden();
    await expect(detail.headerName).toContainText(updated);
  });

  // ─────────────────────────────────────────────
  // TD-12 Delete flow
  // ─────────────────────────────────────────────
  test('TD-12 delete task flow', async ({ page }) => {
    const detail = new TaskDetailPage(page);

    await detail.delete();

    await expect(page).toHaveURL(/\/tasks$/);

    const tasksPage = new TasksPage(page);

    await expect
      .poll(async () => tasksPage.rowExists(taskName))
      .toBe(false);
  });
});