// tests/specs/task-detail.spec.ts
import { expect, ProjectsPage, TaskDetailPage, TasksPage, test } from '../fixtures/fixtures';
import { ProjectData, TaskData } from '../fixtures/test-data';

test.describe('Task Detail page — /tasks/:id', () => {

  let taskName: string;
  let taskId: string;

  // Create a project + task before each test, navigate to task detail
  test.beforeEach(async ({ page }) => {
    // Ensure a project exists
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();
    let projectName: string;
    let userName: string;
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

    // Create a task
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    taskName = `PW Detail Task ${Date.now()}`;
    const users = ['Jip', 'RIC FRANCIS BAYO'];
    userName = users[Math.floor(Math.random() * users.length)];
    const tModal = await tasksPage.openCreateModal();
    await tModal.fill({
      name: taskName,
      description: 'Detail test description',
      priority: 'High',
      executionDate: TaskData.valid.executionDate,
      deadline: TaskData.valid.deadline,
    });
    await tModal.selectProject(projectName);
    await tModal.selectAssignee(userName); // Replace with actual user name if needed
    await tModal.submit();
    await expect(tModal.container).toBeHidden({ timeout: 12_000 });

    // Navigate to task detail via View
    await tasksPage.quickWait(1000);
    await tasksPage.clickView(taskName);
    await page.waitForURL(/\/tasks\/\d+/);
    taskId = page.url().split('/tasks/')[1];
  });

  // ── Page structure ─────────────────────────────────────────────────
  test('TD-01 task detail page loads at correct URL', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(`/tasks/${taskId}`));
  });

  test('TD-02 Back to Tasks button is visible', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.backBtn).toBeVisible();
  });

  test('TD-03 Edit button is visible', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.btnEdit).toBeVisible();
  });

  test('TD-04 Complete button is visible', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.btnComplete).toBeVisible();
  });

  test('TD-05 Delete button is visible', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.btnDelete).toBeVisible();
  });

  // ── Header details ─────────────────────────────────────────────────
  test('TD-06 header shows task name', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.headerName).toBeVisible();
    const name = await detail.getText(detail.headerName);
    expect(name).toContain(taskName);
  });

  test('TD-07 header shows priority badge', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.headerPriority).toBeVisible();
    const priority = await detail.getText(detail.headerPriority);
    expect(priority.toLowerCase()).toContain('high');
  });

  test('TD-08 header shows status badge', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.headerStatus).toBeVisible();
    const status = await detail.getText(detail.headerStatus);
    expect(status.toLowerCase()).toMatch(/to do|todo|in progress/);
  });

  // ── Detail card fields ─────────────────────────────────────────────
  test('TD-09 detail card shows description', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.description).toBeVisible();
    const desc = await detail.getText(detail.description);
    expect(desc).toContain('Detail test description');
  });

  test('TD-10 detail card shows project as clickable link', async ({ page }) => {
    const detail = new TaskDetailPage(page);

    const projectLink = detail.project;

    await expect(projectLink).toBeVisible();
    await expect(projectLink).toHaveAttribute('href', /\/projects\/\d+/);
  });

  test('TD-11 clicking project link navigates to project detail', async ({ page }) => {
    const detail = new TaskDetailPage(page);

    const projectLink = detail.project;

    await projectLink.click();

    await expect(page).toHaveURL(/\/projects\/\d+/);
  });

  test('TD-12 detail card shows assigned to', async ({ page }) => {
    const detail = new TaskDetailPage(page);

    const assigned = detail.assignedTo;

    await expect(assigned).toBeVisible();

    const text = (await assigned.innerText()).trim();

    expect(text.length).toBeGreaterThan(0);
  });

  test('TD-13 detail card shows execution date', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.executionDate).toBeVisible();
  });

  test('TD-14 detail card shows deadline', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.deadline).toBeVisible();
    const dl = await detail.getText(detail.deadline);
    expect(dl.trim().length).toBeGreaterThan(0);
  });

  test('TD-15 detail card shows created date', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await expect(detail.createdDate).toBeVisible();
    const created = await detail.getText(detail.createdDate);
    expect(created.trim().length).toBeGreaterThan(0);
  });

  test('TD-16 completed at field is hidden when task is not complete', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    // CompletedAt should not be visible for an open task
    const completedAt = page.locator('[data-testid="task-detail-completed-at"]')
      .or(page.getByText(/completed at/i));
    // Either not present or hidden
    const count = await completedAt.count();
    if (count > 0) {
      await expect(completedAt).toBeHidden();
    }
  });

  // ── Back navigation ────────────────────────────────────────────────
  test('TD-17 Back button navigates to /tasks', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await detail.clickBack();
    await expect(page).toHaveURL(/\/tasks$/, { timeout: 10_000 });
  });

  // ── Complete action ────────────────────────────────────────────────
  test('TD-18 Complete button marks task as Completed', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await detail.complete();
    await page.waitForLoadState('networkidle');
    const status = await detail.getText(detail.headerStatus);
    expect(status.toLowerCase()).toMatch(/completed|done/);
  });

  test('TD-19 Complete button is hidden after task is completed', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await detail.complete();
    await page.waitForLoadState('networkidle');
    await expect(detail.btnComplete).toBeHidden({ timeout: 8_000 });
  });

  test('TD-20 completed at date appears after completing task', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await detail.complete();
    await page.waitForLoadState('networkidle');
    const completedAt = page.locator('[data-testid="task-detail-completed-at"]')
      .or(page.getByText(/completed at/i).locator('..'));
    await expect(completedAt).toBeVisible({ timeout: 8_000 });
  });

  // ── Edit action ────────────────────────────────────────────────────
  test('TD-21 Edit modal opens from task detail', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    const modal = await detail.openEditModal();
    await expect(modal.container).toBeVisible();
  });

  test('TD-22 Edit modal has Project field disabled', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    const modal = await detail.openEditModal();
    expect(await modal.isProjectDisabled()).toBe(true);
  });

  test('TD-23 editing task name updates header', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    const updatedName = `PW Updated ${Date.now()}`;
    const modal = await detail.openEditModal();
    await modal.nameInput.clear();
    await modal.nameInput.fill(updatedName);
    await modal.submit();
    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    await page.waitForLoadState('networkidle');
    const name = await detail.getText(detail.headerName);
    expect(name).toContain(updatedName);
  });

  // ── Delete action ──────────────────────────────────────────────────
  test('TD-24 Delete navigates back to /tasks after deletion', async ({ page }) => {
    const detail = new TaskDetailPage(page);
    await detail.delete();
    await expect(page).toHaveURL(/\/tasks$/, { timeout: 15_000 });
  });

  test('TD-25 deleted task no longer appears in tasks table', async ({ page }) => {
    const nameToDelete = taskName; // captured in beforeEach
    const detail = new TaskDetailPage(page);
    await detail.delete();
    await expect(page).toHaveURL(/\/tasks$/);
    await detail.quickWait(3000);// wait for deletion to reflect in UI
    const tasksPage = new TasksPage(page);
    expect(await tasksPage.rowExists(nameToDelete)).toBe(false);
  });

});
