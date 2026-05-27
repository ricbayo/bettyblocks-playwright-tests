import { expect, test } from '../fixtures/fixtures';
import { ProjectData } from '../fixtures/test-data';

test.describe('Projects page — /projects', () => {

  test.beforeEach(async ({ projectsPage }) => {
    await expect(projectsPage.table).toBeVisible();

    await expect.poll(
      async () => await projectsPage.rows.count(),
      { timeout: 10000 }
    ).toBeGreaterThan(0);
  });

  // ─────────────────────────────
  // PAGE STRUCTURE
  // ─────────────────────────────

  test('PR-01 projects page loads and shows table', async ({ projectsPage }) => {
    await expect(projectsPage.page).toHaveURL(/\/projects/);
  });

  test('PR-02 New Project button is visible', async ({ projectsPage }) => {
    await expect(projectsPage.btnNewProject).toBeVisible();
  });

  test('PR-03 table has correct columns', async ({ projectsPage }) => {
    const headerTexts = await projectsPage.headers.allTextContents();

    expect(headerTexts.map(t => t.trim())).toEqual([
      'ID',
      'Project Name',
      'Status',
      'Deadline',
      'Owner',
      'Quick Actions',
    ]);
  });

  // ─────────────────────────────
  // MODAL
  // ─────────────────────────────

  test('PR-04 Create Project modal opens', async ({ projectsPage }) => {
    const modal = await projectsPage.openCreateModal();
    await expect(modal.container).toBeVisible();
  });

  test('PR-05 status defaults to New and disabled', async ({ projectsPage }) => {
    const modal = await projectsPage.openCreateModal();

    await expect(modal.statusSelect).toBeVisible();

    expect((await modal.getStatusValue()).toLowerCase())
      .toContain('new');

    expect(await modal.isStatusDisabled())
      .toBe(true);
  });

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────

  test('PR-06 valid project is created', async ({ projectsPage }) => {
    const data = {
      ...ProjectData.valid,
      name: `PW ${Date.now()}`
    };

    await projectsPage.createProject(data);

    expect(await projectsPage.rowExists(data.name))
      .toBe(true);
  });

  test('PR-07 created project has New status', async ({ projectsPage }) => {
    const data = {
      ...ProjectData.valid,
      name: `PW Status ${Date.now()}`
    };

    await projectsPage.createProject(data);

    expect(
      (await projectsPage.getRowStatus(data.name)).toLowerCase()
    ).toContain('new');
  });

  // ─────────────────────────────
  // ACTIONS
  // ─────────────────────────────

  test('PR-08 View navigates to detail', async ({ page, projectsPage }) => {
    const projectName = await projectsPage.getFirstProjectName();

    await projectsPage.clickView(projectName);

    await expect(page).toHaveURL(/\/projects\/\d+/);
  });

  test('PR-09 Edit opens modal', async ({ projectsPage }) => {
    const projectName = await projectsPage.getFirstProjectName();

    const modal = await projectsPage.clickEdit(projectName);

    await expect(modal.container).toBeVisible();

    expect(await modal.isStatusEditable())
      .toBe(true);
  });

  test('PR-10 Copy creates duplicated project', async ({ projectsPage }) => {
    const projectName = await projectsPage.getFirstProjectName();

    await projectsPage.clickCopy(projectName);

    await expect.poll(async () =>
      await projectsPage.rowExists(`${projectName}_copy`)
    ).toBe(true);
  });

  test('PR-11 Delete removes project', async ({ projectsPage }) => {
    const data = {
      name: `PW Delete ${Date.now()}`,
      deadline: ProjectData.valid.deadline
    };

    await projectsPage.createProject(data);

    await projectsPage.clickDelete(data.name);

    await expect.poll(async () =>
      await projectsPage.rowExists(data.name)
    ).toBe(false);
  });

  test('PR-12 Close changes status to Executed', async ({ projectsPage }) => {
    const data = {
      name: `PW Close ${Date.now()}`,
      deadline: ProjectData.valid.deadline
    };

    await projectsPage.createProject(data);

    await projectsPage.clickClose(data.name);

    await expect.poll(async () =>
      (await projectsPage.getRowStatus(data.name)).toLowerCase()
    ).toMatch(/executed|closed/);
  });

});