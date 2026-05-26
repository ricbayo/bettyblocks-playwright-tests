// tests/fixtures/test-data.ts

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0]; // yyyy-mm-dd
}

function pastDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0];
}

export const ProjectData = {
  valid: {
    name: `PW Project ${Date.now()}`,
    description: 'Created by Playwright automation',
    deadline: futureDate(7),
  },
  minName: {
    name: 'ABC',
    deadline: futureDate(1),
  },
  maxName: {
    name: 'A'.repeat(255),
    deadline: futureDate(3),
  },
  specialChars: {
    name: `Special & Test <> ${Date.now()}`,
    deadline: futureDate(5),
  },
  todayDeadline: {
    name: `Today DL ${Date.now()}`,
    deadline: futureDate(0),
  },
  updated: {
    name: `PW Updated ${Date.now()}`,
    description: 'Updated by Playwright',
    deadline: futureDate(14),
  },
};

export const InvalidProjectData = {
  emptyName:    { name: '',   deadline: futureDate(7) },
  shortName:    { name: 'AB', deadline: futureDate(7) },
  pastDeadline: { name: 'Past DL Project', deadline: pastDate(1) },
  noDeadline:   { name: 'No Deadline Project', deadline: '' },
};

export const TaskData = {
  valid: {
    name: `PW Task ${Date.now()}`,
    description: 'Created by Playwright automation',
    priority: 'High',
    executionDate: futureDate(2),
    deadline: futureDate(5),
  },
  minName: {
    name: 'XYZ',
    deadline: futureDate(3),
  },
  updated: {
    name: `PW Task Updated ${Date.now()}`,
    priority: 'Medium',
  },
};

export const InvalidTaskData = {
  emptyName:   { name: '', deadline: futureDate(3) },
  shortName:   { name: 'AB', deadline: futureDate(3) },
  noProject:   { name: 'No Project Task', deadline: futureDate(3) },
};
