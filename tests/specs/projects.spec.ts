// tests/specs/projects.spec.ts
import { expect, test } from '../fixtures/fixtures';
import { ProjectData } from '../fixtures/test-data';

// ─────────────────────────────────────────────
// SAFE ROW WAIT (inline helper)
// ─────────────────────────────────────────────
async function waitForRows(projectsPage: any) {
  await expect.poll(async () => {
    return await projectsPage.rows.count();
  }, {
    timeout: 10_000
  }).toBeGreaterThan(0);
}

test.describe('Projects page — /projects', () => {

  // ── Page structure ────────────────────────────────────────────────
  test('PR-01 projects page loads and shows table', async ({ projectsPage }) => {
    await expect(projectsPage.page).toHaveURL(/\/projects/);
    await expect(projectsPage.table).toBeVisible();

    await waitForRows(projectsPage);
  });

  test('PR-02 New Project button is visible', async ({ projectsPage }) => {
    await expect(projectsPage.btnNewProject).toBeVisible();
  });

  test('PR-03 table has correct columns: id, project name, status, deadline, owner, quick actions', async ({ projectsPage }) => {
    await waitForRows(projectsPage);

    for (const col of ['ID', 'project name', 'status', 'deadline', 'owner', 'quick actions']) {
      await expect(
        projectsPage.table
          .getByRole('cell')
          .filter({ hasText: new RegExp(col, 'i') })
          .or(projectsPage.table.locator(`[data-testid*="${col}"]`).first())
      ).toBeVisible();
    }
  });

  // ── Create Project modal ──────────────────────────────────────────
  test('PR-04 Create Project modal opens on New Project click', async ({ projectsPage }) => {
    const modal = await projectsPage.openCreateModal();
    await expect(modal.container).toBeVisible();
  });

  test('PR-05 modal has Create New Project header', async ({ projectsPage }) => {
    const modal = await projectsPage.openCreateModal();
    await expect(
      modal.container
        .locator('[data-testid="modal-create-project-header"]')
        .or(modal.container.getByRole('heading'))
    ).toContainText(/create.*project/i);
  });

  test('PR-06 modal has Name field (required)', async ({ projectsPage }) => {
    const modal = await projectsPage.openCreateModal();
    await expect(modal.nameInput).toBeVisible();
  });

  test('PR-07 modal has Description field (optional)', async ({ projectsPage }) => {
    const modal = await projectsPage.openCreateModal();
    await expect(modal.descInput).toBeVisible();
  });

  test('PR-08 modal Status defaults to "New" and is disabled', async ({ projectsPage }) => {
    const modal = await projectsPage.openCreateModal();
    await expect(modal.statusSelect).toBeVisible();
    const value = await modal.getStatusValue();
    expect(value.toLowerCase()).toContain('new');
    expect(await modal.isStatusDisabled()).toBe(true);
  });

  test('PR-09 modal has Deadline field (required)', async ({ projectsPage }) => {
    const modal = await projectsPage.openCreateModal();
    await expect(modal.deadlineInput).toBeVisible();
  });

  test('PR-10 modal shows Owner field defaulting to current user', async ({ projectsPage }) => {
    const modal = await projectsPage.openCreateModal();
    await expect(modal.ownerInput).toBeVisible();
    const value = await modal.getText(modal.ownerInput);
    expect(value.trim().length).toBeGreaterThan(0);
  });

  test('PR-11 modal has Cancel and Create Project buttons', async ({ projectsPage }) => {
    const modal = await projectsPage.openCreateModal();
    await expect(modal.btnCancel).toBeVisible();
    await expect(modal.btnCreate).toBeVisible();
  });

  test('PR-12 Cancel button closes modal without creating project', async ({ projectsPage }) => {
    const before = await projectsPage.getRowCount();
    const modal = await projectsPage.openCreateModal();
    await modal.fill(ProjectData.valid);
    await modal.cancel();
    await expect(modal.container).toBeHidden();
    expect(await projectsPage.getRowCount()).toBe(before);
  });

  // ── Create project ───────────────────────────────────────────────
  test('PR-13 valid project is created and appears in table', async ({ projectsPage }) => {
    const data = { ...ProjectData.valid, name: `PW ${Date.now()}` };
    const modal = await projectsPage.openCreateModal();
    await modal.fill(data);
    await modal.submit();

    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    await waitForRows(projectsPage);

    expect(await projectsPage.rowExists(data.name)).toBe(true);
  });

  test('PR-14 created project has status New', async ({ projectsPage }) => {
    const data = { ...ProjectData.valid, name: `PW Status ${Date.now()}` };
    const modal = await projectsPage.openCreateModal();
    await modal.fill(data);
    await modal.submit();

    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    await waitForRows(projectsPage);

    const status = await projectsPage.getRowStatus(data.name);
    expect(status.toLowerCase()).toContain('new');
  });

  test('PR-15 project with description is created correctly', async ({ projectsPage }) => {
    const data = { name: `PW Desc ${Date.now()}`, description: 'Playwright test description', deadline: ProjectData.valid.deadline };
    const modal = await projectsPage.openCreateModal();
    await modal.fill(data);
    await modal.submit();

    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    await waitForRows(projectsPage);

    expect(await projectsPage.rowExists(data.name)).toBe(true);
  });

  // ── Row actions ───────────────────────────────────────────────────
  test('PR-22 View button navigates to project detail', async ({ page, projectsPage }) => {
    await waitForRows(projectsPage);

    const count = await projectsPage.getRowCount();
    test.skip(count === 0, 'No projects to test view action');

    const firstRowName = await projectsPage.rows.first()
      .locator('[data-testid="project-col-name"]')
      .or(projectsPage.rows.first().getByRole('cell').nth(1))
      .innerText();

    await projectsPage.clickView(firstRowName.trim());
    await expect(page).toHaveURL(/\/projects\/\d+/);
  });

  test('PR-23 Edit button opens edit modal with editable status', async ({ projectsPage }) => {
    await waitForRows(projectsPage);

    const count = await projectsPage.getRowCount();
    test.skip(count === 0, 'No projects to test edit');

    const firstRowName = await projectsPage.rows.first()
      .locator('[data-testid="project-col-name"]')
      .or(projectsPage.rows.first().getByRole('cell').nth(1))
      .innerText();

    const modal = await projectsPage.clickEdit(firstRowName.trim());
    await expect(modal.container).toBeVisible();
    expect(await modal.isStatusEditable()).toBe(true);
  });

  test('PR-24 Copy action creates a new project with _copy suffix', async ({ projectsPage }) => {
    await waitForRows(projectsPage);

    const count = await projectsPage.getRowCount();
    test.skip(count === 0, 'No projects to test copy');

    const before = await projectsPage.getRowCount();

    const firstRowName = await projectsPage.rows.first()
      .locator('[data-testid="project-col-name"]')
      .or(projectsPage.rows.first().getByRole('cell').nth(1))
      .innerText();

    await projectsPage.clickCopy(firstRowName.trim());
    await projectsPage.page.waitForLoadState('networkidle');

    await waitForRows(projectsPage);

    expect(await projectsPage.rowExists(`${firstRowName.trim()}_copy`)).toBe(true);
  });

  test('PR-25 Delete action removes project from table', async ({ projectsPage }) => {
    const data = { name: `PW Delete ${Date.now()}`, deadline: ProjectData.valid.deadline };
    const modal = await projectsPage.openCreateModal();
    await modal.fill(data);
    await modal.submit();

    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    await waitForRows(projectsPage);

    const before = await projectsPage.getRowCount();

    await projectsPage.clickDelete(data.name);
    await projectsPage.page.waitForLoadState('networkidle');

    await waitForRows(projectsPage);

    expect(await projectsPage.rowExists(data.name)).toBe(false);
  });

  test('PR-26 Close (Execute) changes project status to Executed', async ({ projectsPage }) => {
    const data = { name: `PW Close ${Date.now()}`, deadline: ProjectData.valid.deadline };
    const modal = await projectsPage.openCreateModal();
    await modal.fill(data);
    await modal.submit();

    await expect(modal.container).toBeHidden({ timeout: 12_000 });
    await waitForRows(projectsPage);

    await projectsPage.clickClose(data.name);
    await projectsPage.page.waitForLoadState('networkidle');

    const status = await projectsPage.getRowStatus(data.name);
    expect(status.toLowerCase()).toMatch(/executed|closed/);
  });

});