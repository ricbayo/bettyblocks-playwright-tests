// tests/pages/Modals.ts
import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

// ─────────────────────────────────────────────────────────────────────────────
// BaseModal — shared logic for all modals
// ─────────────────────────────────────────────────────────────────────────────
export class Modals extends BasePage {
  readonly container: Locator;

  constructor(page: Page, containerSelector: string, header?: string) {
    super(page);
    this.container = page.locator('div[role="dialog"][aria-modal="true"]');
  }

  async waitForVisible(timeout = 10_000) {
    await expect(this.container).toBeVisible({ timeout });
  }

  async waitForHidden(timeout = 12_000) {
    await expect(this.container).toBeHidden({ timeout });
  }

  async isVisible(): Promise<boolean> {
    return this.container.isVisible();
  }

  protected field(testId: string, fallbackLabel?: RegExp) {
    const loc = this.container.locator(testId);
    if (fallbackLabel) {
      return loc.or(this.container.getByLabel(fallbackLabel));
    }
    return loc;
  }

  protected btn(testId: string, fallbackName: RegExp) {
    return this.container
      .locator(testId)
      .or(this.container.getByRole('button', { name: fallbackName }));
  }

  protected getError(testId: string) {
    return this.container
      .locator(testId)
      .or(this.container.locator('[class*="error"]').first());
  }

}

// ─────────────────────────────────────────────────────────────────────────────
// CreateProjectModal
// ─────────────────────────────────────────────────────────────────────────────
export class CreateProjectModal extends Modals {
  readonly nameInput: Locator;
  readonly descInput: Locator;
  readonly statusSelect: Locator;
  readonly deadlineInput: Locator;
  readonly ownerInput: Locator;
  readonly btnCancel: Locator;
  readonly btnCreate: Locator;
  readonly errorName: Locator;
  readonly errorDeadline: Locator;

  constructor(page: Page) {
    super(page, '[data-testid="modal-create-project"]', 'Create New Project');
    this.nameInput = this.field('#Name');
    this.descInput = this.field('#Description');
    this.statusSelect = this.field('#Status');
    this.deadlineInput = this.field('#Deadline');
    this.ownerInput = this.field('#Owner');
    this.btnCancel = this.container.getByRole('button', { name: 'Cancel' });
    this.btnCreate = this.container.getByRole('button', { name: 'Confirm' });
    this.errorName = this.page.getByText(/error! please try again/i);
    this.errorDeadline = this.getError('[data-testid="error-project-deadline"]');
  }

  async fill(data: { name?: string; description?: string; deadline?: string }) {
    if (data.name !== undefined) {
      await this.nameInput.clear();
      await this.nameInput.fill(data.name);
      await this.quickWait();
    }
    if (data.description) await this.descInput.fill(data.description);
    if (data.deadline) await this.fillDate(this.deadlineInput, data.deadline);
    await this.quickWait();
  }

  async submit() { await this.btnCreate.click(); await this.quickWait(2000); }
  async cancel() {
    await this.btnCancel.click();
    await this.waitForHidden();
    await this.quickWait();
  }

  async getStatusValue(): Promise<string> {
    return this.getText(this.statusSelect);
  }

  async isStatusDisabled(): Promise<boolean> {
    return this.statusSelect.isDisabled();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EditProjectModal
// ─────────────────────────────────────────────────────────────────────────────
export class EditProjectModal extends Modals {
  readonly nameInput: Locator;
  readonly descInput: Locator;
  readonly statusSelect: Locator;
  readonly deadlineInput: Locator;
  readonly btnCancel: Locator;
  readonly btnSave: Locator;

  constructor(page: Page) {
    super(page, '[data-testid="modal-edit-project"]', 'Edit project');
    this.nameInput = this.field('[data-testid="input-project-name"]', /project name/i);
    this.descInput = this.field('[data-testid="input-project-description"]', /description/i);
    this.statusSelect = this.field('[data-testid="select-project-status"]', /status/i);
    this.deadlineInput = this.field('[data-testid="input-project-deadline"]', /deadline/i);
    this.btnCancel = this.btn('[data-testid="btn-cancel-project"]', /cancel/i);
    this.btnSave = this.btn('[data-testid="btn-save-project"]', /save|update|confirm/i);
  }

  async fill(data: { name?: string; description?: string; deadline?: string }) {
    if (data.name !== undefined) { await this.nameInput.clear(); await this.nameInput.fill(data.name); }
    if (data.description) await this.descInput.fill(data.description);
    if (data.deadline) await this.fillDate(this.deadlineInput, data.deadline);
  }

  async isStatusEditable(): Promise<boolean> {
    return !(await this.statusSelect.isDisabled());
  }

  async submit() { await this.btnSave.click(); }
  async cancel() { await this.btnCancel.click(); await this.waitForHidden(); }
}

// ─────────────────────────────────────────────────────────────────────────────
// CreateTaskModal  (used from /tasks page)
// ─────────────────────────────────────────────────────────────────────────────
export class CreateTaskModal extends Modals {
  readonly nameInput: Locator;
  readonly descInput: Locator;
  readonly projectSelect: Locator;
  readonly assignedInput: Locator;
  readonly prioritySelect: Locator;
  readonly statusSelect: Locator;
  readonly execDateInput: Locator;
  readonly deadlineInput: Locator;
  readonly btnCancel: Locator;
  readonly btnCreate: Locator;
  readonly errorName: Locator;
  readonly errorProject: Locator;

  constructor(page: Page) {
    super(page, '[data-testid="modal-create-task"]', 'Create task');
    this.nameInput = this.field('[data-testid="input-task-name"]', /task name|name/i);
    this.descInput = this.field('[data-testid="input-task-description"]', /description/i);
    this.projectSelect = this.field('[data-testid="select-task-project"]', /project/i);
    this.assignedInput = this.field('[data-testid="input-task-assigned"]', /assigned/i);
    this.prioritySelect = this.field('[data-testid="select-task-priority"]', /priority/i);
    this.statusSelect = this.field('[data-testid="select-task-status"]', /status/i);
    this.execDateInput = this.field('[data-testid="input-task-execution-date"]', /execution date/i);
    this.deadlineInput = this.field('[data-testid="input-task-deadline"]', /deadline/i);
    this.btnCancel = this.btn('[data-testid="btn-cancel-task"]', /cancel/i);
    this.btnCreate = this.btn('[data-testid="btn-create-task"]', /create task|confirm/i);
    this.errorName = this.getError('[data-testid="error-task-name"]');
    this.errorProject = this.getError('[data-testid="error-task-project"]');
  }

  async fill(data: {
    name?: string;
    description?: string;
    priority?: string;
    executionDate?: string;
    deadline?: string;
  }) {
    if (data.name !== undefined) { await this.nameInput.clear(); await this.nameInput.fill(data.name); }
    if (data.description) await this.descInput.fill(data.description);
    if (data.priority) await this.prioritySelect.selectOption(data.priority);
    if (data.executionDate) await this.fillDate(this.execDateInput, data.executionDate);
    if (data.deadline) await this.fillDate(this.deadlineInput, data.deadline);
  }

  async selectProject(projectName: string) {
    await this.projectSelect.selectOption({ label: projectName });
  }

  async selectAssignee(userName: string) {
    await this.assignedInput.selectOption({ label: userName });
  }

  async getPriorityValue(): Promise<string> {
    return this.getText(this.prioritySelect);
  }

  async getStatusValue(): Promise<string> {
    return this.getText(this.statusSelect);
  }

  async submit() {
    await this.btnCreate.click();
    await this.waitForBB();
    await this.waitForHidden();
    await this.quickWait(4000);
  }
  async cancel() { await this.btnCancel.click(); await this.waitForHidden(); }
}

// ─────────────────────────────────────────────────────────────────────────────
// AddTaskModal  (from project detail — project pre-filled & disabled)
// ─────────────────────────────────────────────────────────────────────────────
export class AddTaskModal extends CreateTaskModal {
  constructor(page: Page) {
    super(page);
    // Override container to also match add-task modal testid
    // (both modals share the same form structure)
  }

  async isProjectDisabled(): Promise<boolean> {
    return this.projectSelect.isDisabled();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EditTaskModal  (project field disabled)
// ─────────────────────────────────────────────────────────────────────────────
export class EditTaskModal extends CreateTaskModal {
  readonly btnSave: Locator;

  constructor(page: Page) {
    super(page);
    this.btnSave = this.btn('[data-testid="btn-save-task"]', /save|update|confirm/i);
  }

  async isProjectDisabled(): Promise<boolean> {
    return this.projectSelect.isDisabled();
  }

  async submit() { await this.btnSave.click(); }
}
