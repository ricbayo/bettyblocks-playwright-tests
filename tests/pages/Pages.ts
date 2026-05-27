// tests/pages/Pages.ts
import { Locator, Page, expect } from '@playwright/test';
import { S } from '../utils/selectors';
import { BasePage } from './BasePage';
import {
  AddTaskModal,
  CreateProjectModal,
  CreateTaskModal,
  EditProjectModal,
  EditTaskModal,
} from './Modals';


// ─────────────────────────────────────────────────────────────────────────────
// DashboardPage
// ─────────────────────────────────────────────────────────────────────────────
export class DashboardPage extends BasePage {
  readonly kpiTotalProjects: Locator;
  readonly kpiOpenTasks: Locator;
  readonly kpiOverdueTasks: Locator;
  readonly kpiHighPriority: Locator;
  readonly priorityTable: Locator;
  readonly priorityRows: Locator;

  constructor(page: Page) {
    super(page);

    this.kpiTotalProjects = page.locator(S.dashboard.kpiTotalProjects);
    this.kpiOpenTasks = page.locator(S.dashboard.kpiOpenTasks);
    this.kpiOverdueTasks = page.locator(S.dashboard.kpiOverdueTasks);
    this.kpiHighPriority = page.locator(S.dashboard.kpiHighPriority);

    this.priorityTable = page.locator(S.dashboard.priorityTable);
    this.priorityRows = this.priorityTable.locator(S.dashboard.priorityRow);
  }

  async goto() {
    await this.page.goto('/home');
    await this.page.waitForLoadState('networkidle');
  }

  async getKpiValue(kpi: Locator): Promise<string> {
    return this.getText(kpi);
  }

  /**
   * Get row by task name
   * NOTE: removed async because Locator is synchronous
   */
  getRowByTaskName(name: string): Locator {
    return this.priorityRows.filter({ hasText: name });
  }

  /**
   * Click View button on a priority row
   * More resilient than getByRole()
   */
  async clickViewOnRow(row: Locator) {
    const viewBtn = row.getByRole('button', { name: 'View' })
    await viewBtn.click();
  }

  /**
   * Click Close button on a priority row
   */
  async clickCloseOnRow(row: Locator) {
    const viewBtn = row.getByRole('button', { name: 'close' })
    await viewBtn.click();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProjectsPage
// ─────────────────────────────────────────────────────────────────────────────
export class ProjectsPage extends BasePage {
  readonly btnNewProject: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly headers: Locator;

  constructor(page: Page) {
    super(page);
    this.btnNewProject = page.locator(S.projects.btnNew);
    this.table = page.locator(S.projects.table);
    this.rows = this.table.locator(S.projects.rows);
    this.headers = this.table.locator(S.projects.rowHeader);
  }

  get firstDataRow(): Locator {
    return this.rows.nth(1);
  }

  async goto() {
    await this.page.goto('/projects');
    await this.page.waitForLoadState('networkidle');
  }

  async openCreateModal(): Promise<CreateProjectModal> {
    await this.btnNewProject.click();
    const modal = new CreateProjectModal(this.page);
    await modal.waitForVisible();
    return modal;
  }

  async createProject(data: { name?: string; description?: string; deadline?: string }) {
    const modal = await this.openCreateModal();
    await modal.fill(data);
    await modal.submit();

    await expect(modal.container).toBeHidden({
      timeout: 12000
    });
  }

  async getFirstProjectName(): Promise<string> {
    return (
      await this.firstDataRow
        .locator('td')
        .nth(1)
        .innerText()
    ).trim();
  }

  async getRowByName(name: string): Promise<Locator> {
    await this.quickWait();
    return this.rows.filter({ hasText: name });
  }

  async getRowHeaderByName(name: string): Promise<Locator> {
    await this.quickWait();
    return this.headers.filter({ hasText: name });
  }

  async rowExists(name: string): Promise<boolean> {
    await this.quickWait(1000);
    const row = await this.getRowByName(name);
    return (await row.count()) > 0;
  }

  async getRowCount(): Promise<number> {
    await this.quickWait();
    return this.rows.count();
  }

  async clickEdit(name: string): Promise<EditProjectModal> {
    await this.quickWait();
    const row = await this.getRowByName(name);
    await row.locator('[data-testid="project-action-edit"]')
      .or(row.getByRole('button', { name: /edit/i }))
      .click();
    await this.quickWait();
    const modal = new EditProjectModal(this.page);
    await modal.waitForVisible();
    return modal;
  }

  async clickView(name: string) {
    await this.quickWait();
    const row = await this.getRowByName(name);
    await row.locator('[data-testid="project-action-view"]')
      .or(row.getByRole('button', { name: /view/i }))
      .click();
    await this.quickWait();
    await this.page.waitForURL(/\/projects\/\d+/, { timeout: 15_000 });
  }

  async clickClose(name: string) {
    await this.quickWait();
    const row = await this.getRowByName(name);
    await row.locator('[data-testid="project-action-close"]')
      .or(row.getByRole('button', { name: /close|execute/i }))
      .click();
    await this.quickWait();
    await this.confirmDialog();
  }

  async clickCopy(name: string) {
    await this.quickWait();
    const row = await this.getRowByName(name);
    await row.locator('[data-testid="project-action-copy"]')
      .or(row.getByRole('button', { name: /copy/i }))
      .click();
    await this.quickWait();
    await this.confirmDialog();
  }


  async clickDelete(name: string) {
    await this.quickWait();
    const row = await this.getRowByName(name);
    await row.locator('[data-testid="project-action-delete"]')
      .or(row.getByRole('button', { name: /delete/i }))
      .click();
    await this.quickWait();
    await this.confirmDialog();
  }

  async getRowStatus(name: string): Promise<string> {
    await this.quickWait();
    const row = await this.getRowByName(name);
    return this.getText(row.locator('td').nth(2).locator('p'));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProjectDetailPage
// ─────────────────────────────────────────────────────────────────────────────

export class ProjectDetailPage extends BasePage {

  readonly detailsCard: Locator;

  readonly backBtn: Locator;
  readonly btnEdit: Locator;
  readonly btnClose: Locator;
  readonly btnAddTask: Locator;

  readonly taskTable: Locator;
  readonly taskHeader: Locator;
  readonly taskRows: Locator;

  get nameEl(): Locator {
    return this.page.locator(S.projectDetail.detailValue('Project Name'));
  }

  get statusEl(): Locator {
    return this.page.locator(S.projectDetail.detailValue('Status'));
  }

  get deadlineEl(): Locator {
    return this.fieldValue('Deadline');
  }

  get ownerEl(): Locator {
    return this.fieldValue('Owner');
  }

  constructor(page: Page) {
    super(page);

    this.detailsCard = page.locator(S.projectDetail.detailsCard);

    this.backBtn = page.locator(S.projectDetail.btnBack);

    this.btnEdit = page.locator(S.projectDetail.btnEdit);

    this.btnClose = page.locator(S.projectDetail.btnClose);

    this.btnAddTask = page.locator(S.projectDetail.btnAddTask);

    this.taskTable = page.locator(S.projectDetail.table);

    this.taskHeader = this.taskTable.locator(S.projectDetail.headerRow);

    this.taskRows = this.taskTable.locator(S.projectDetail.rows);
  }

  async goto(projectId: string | number) {
    await this.page.goto(`/projects/${projectId}`);
    await expect(this.taskTable).toBeVisible();
  }

  getTaskColumnHeader(columnName: string): Locator {
    return this.taskHeader.getByText(
      new RegExp(`^${columnName}$`, 'i')
    );
  }

  async openEditModal(): Promise<EditProjectModal> {
    await this.btnEdit.click();

    const modal = new EditProjectModal(this.page);

    await modal.waitForVisible();

    return modal;
  }

  async openAddTaskModal(): Promise<AddTaskModal> {
    await this.btnAddTask.click();

    const modal = new AddTaskModal(this.page);

    await modal.waitForVisible();

    return modal;
  }

  getTaskRowByName(name: string): Locator {
    return this.taskRows.filter({ hasText: name });
  }

  getTaskStatusLocator(name: string): Locator {
    return this
      .getTaskRowByName(name)
      .locator('td')
      .nth(3);
  }

  async clickCompleteTask(name: string) {
    const row = this.getTaskRowByName(name);

    await row.locator(S.projectDetail.btnTaskComplete).click();

    await expect(
      this.getTaskStatusLocator(name)
    ).toContainText(/completed/i);
  }

  async clickEditTask(name: string): Promise<EditTaskModal> {
    const row = this.getTaskRowByName(name);

    await row.locator(S.projectDetail.btnTaskEdit).click();

    const modal = new EditTaskModal(this.page);

    await modal.waitForVisible();

    return modal;
  }

  async clickDeleteTask(name: string) {
    const row = this.getTaskRowByName(name);

    await row.locator(S.projectDetail.btnTaskDelete).click();

    await this.confirmDialog();

    await expect.poll(async () => row.count()).toBe(0);
  }

  async closeProject() {
    await this.btnClose.click();

    await this.confirmDialog();

    await expect(this.statusEl)
      .toContainText(/executed|closed/i);
  }

  private fieldValue(label: string): Locator {
    return this.page.locator(
      S.projectDetail.detailValue(label)
    );
  }

  async rowExists(name: string): Promise<boolean> {
    await this.quickWait(1000);
    const row = await this.getTaskRowByName(name);
    return (await row.count()) > 0;
  }

}

// ─────────────────────────────────────────────────────────────────────────────
// TasksPage
// ─────────────────────────────────────────────────────────────────────────────
export class TasksPage extends BasePage {
  readonly btnNewTask: Locator;
  readonly taskTable: Locator;
  readonly taskHeader: Locator;
  readonly taskRows: Locator;

  constructor(page: Page) {
    super(page);
    this.btnNewTask = page.locator('[data-testid="btn-new-task"]').or(page.getByRole('button', { name: /new task/i }));
    this.taskTable = page.getByRole('table');
    this.taskHeader = this.taskTable.locator('tbody tr').first();
    this.taskRows = this.taskTable.locator('tbody tr:not(:first-child)');
  }

  async goto() {
    await this.page.goto('/tasks');
    await this.page.waitForLoadState('networkidle');
  }

  async getTaskColumnHeader(columnName: string): Promise<Locator> {
    return this.taskHeader.locator('td p', {
      hasText: new RegExp(`^${columnName}$`, 'i'),
    });
  }

  async openCreateModal(): Promise<CreateTaskModal> {
    await this.btnNewTask.click();
    const modal = new CreateTaskModal(this.page);
    await modal.waitForVisible();
    return modal;
  }

  async getRowByName(name: string): Promise<Locator> {
    return this.taskRows.filter({ hasText: name });
  }

  async rowExists(name: string): Promise<boolean> {
    return (await (await this.getRowByName(name)).count()) > 0;
  }

  async getRowCount(): Promise<number> {
    return this.taskRows.count();
  }

  async clickView(name: string) {
    const row = await this.getRowByName(name);
    await row.locator('[data-testid="task-action-view"]')
      .or(row.getByRole('button', { name: /view/i }))
      .click();
    await this.page.waitForURL(/\/tasks\/\d+/, { timeout: 15_000 });
  }

  async clickComplete(name: string) {
    const row = await this.getRowByName(name);
    await row.locator('[data-testid="task-action-complete"]')
      .or(row.getByRole('button', { name: /complete/i }))
      .click();
    await this.quickWait(1000);
  }

  async clickEdit(name: string): Promise<EditTaskModal> {
    const row = await this.getRowByName(name);
    await row.locator('[data-testid="task-action-edit"]')
      .or(row.getByRole('button', { name: /edit/i }))
      .click();
    const modal = new EditTaskModal(this.page);
    await modal.waitForVisible();
    return modal;
  }

  async clickDelete(name: string) {
    const row = await this.getRowByName(name);
    await row.locator('[data-testid="task-action-delete"]')
      .or(row.getByRole('button', { name: /delete/i }))
      .click();
    await this.confirmDialog();
  }

  async getRowStatus(name: string): Promise<string> {
    const row = await this.getRowByName(name);
    return this.getText(
      row.locator('td').nth(4).locator('p')
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TaskDetailPage
// ─────────────────────────────────────────────────────────────────────────────
export class TaskDetailPage extends BasePage {
  readonly backBtn: Locator;
  readonly btnEdit: Locator;
  readonly btnComplete: Locator;
  readonly btnDelete: Locator;

  readonly headerName: Locator;
  readonly headerPriority: Locator;
  readonly headerStatus: Locator;

  readonly description: Locator;
  readonly project: Locator;
  readonly assignedTo: Locator;
  readonly executionDate: Locator;
  readonly deadline: Locator;
  readonly createdDate: Locator;

  constructor(page: Page) {
    super(page);

    this.backBtn = page.getByRole('link', { name: /back to tasks/i });

    // Action buttons
    this.btnEdit = page.getByRole('button', { name: /^edit$/i });
    this.btnComplete = page.getByRole('button', { name: /^complete$/i });
    this.btnDelete = page.getByRole('button', { name: /^delete$/i });

    // Header section
    this.headerName = page
      .locator('p', { hasText: 'Task Name' })
      .locator('xpath=following-sibling::p[1]');

    this.headerPriority = page
      .locator('p', { hasText: 'Priority:' })
      .locator('xpath=following-sibling::p[1]');

    this.headerStatus = page
      .locator('p', { hasText: 'Status:' })
      .locator('xpath=following-sibling::p[1]');

    // Detail section
    this.description = page
      .locator('p', { hasText: 'Description' })
      .locator('xpath=following-sibling::p[1]');

    this.project = page
      .locator('h4', { hasText: 'Task Details' })
      .locator('..')
      .locator('div')
      .filter({
        has: page.locator('p', { hasText: /^Project$/ })
      })
      .locator('a');

    this.assignedTo = page
      .locator('p', { hasText: /^Assigned To$/ })
      .locator('..') // parent container
      .locator('div p');

    this.executionDate = page
      .locator('p', { hasText: 'Execution Date' })
      .locator('xpath=ancestor::div[1]//div/p[last()]');

    this.deadline = page
      .locator('p', { hasText: 'Deadline' })
      .locator('xpath=ancestor::div[1]//div/p[last()]');

    this.createdDate = page
      .locator('p', { hasText: 'Created Date' })
      .locator('xpath=ancestor::div[1]//div/p[last()]');
  }

  async goto(taskId: string | number) {
    await this.page.goto(`/tasks/${taskId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async openEditModal(): Promise<EditTaskModal> {
    await this.btnEdit.click();
    const modal = new EditTaskModal(this.page);
    await modal.waitForVisible();
    return modal;
  }

  async complete() {
    await this.btnComplete.click();
    await this.quickWait(2000);
  }

  async delete() {
    await this.btnDelete.click();
    await this.confirmDialog();
    await this.page.waitForURL(/\/tasks$/, { timeout: 15_000 });
  }

  async clickBack() {
    await this.backBtn.click();
    await this.page.waitForURL(/\/tasks$/, { timeout: 10_000 });
  }
}
