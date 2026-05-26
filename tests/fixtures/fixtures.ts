// tests/fixtures/fixtures.ts
import { test as base } from '@playwright/test';
import { CreateProjectModal } from '../pages/Modals';
import {
  DashboardPage,
  ProjectsPage,
  TasksPage
} from '../pages/Pages';

type Fixtures = {
  dashboardPage: DashboardPage;
  projectsPage: ProjectsPage;
  createProjectModal: CreateProjectModal;
  tasksPage: TasksPage;
};

export const test = base.extend<Fixtures>({
  dashboardPage: async ({ page }, use) => {
    const p = new DashboardPage(page);
    await p.goto();
    await use(p);
  },

  projectsPage: async ({ page }, use) => {
    const p = new ProjectsPage(page);
    await p.goto();
    await use(p);
  },

  createProjectModal: async ({ page }, use) => {
    const p = new ProjectsPage(page);
    await p.goto();
    const modal = await p.openCreateModal();
    await use(modal);
  },

  tasksPage: async ({ page }, use) => {
    const p = new TasksPage(page);
    await p.goto();
    await use(p);
  },
});

export { expect } from '@playwright/test';
export { AddTaskModal, CreateProjectModal, CreateTaskModal, EditProjectModal, EditTaskModal } from '../pages/Modals';
export {
  DashboardPage, ProjectDetailPage, ProjectsPage, TaskDetailPage, TasksPage
} from '../pages/Pages';

