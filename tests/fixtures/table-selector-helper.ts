export const projectTableSelectors = {
  table: {
    root: 'table',
    body: 'table tbody',
  },

  // ------------------------
  // ROWS
  // ------------------------
  rows: {
    all: 'table tbody tr',
    byId: (id: string | number) =>
      `table tbody tr:has(td:first-child:text-is("${id}"))`,
    byName: (name: string) =>
      `table tbody tr:has(td:nth-child(2):has-text("${name}"))`,
  },

  // ------------------------
  // COLUMNS (relative to row)
  // ------------------------
  columns: {
    id: 'td:nth-child(1)',
    name: 'td:nth-child(2)',
    status: 'td:nth-child(3)',
    deadline: 'td:nth-child(4)',
    owner: 'td:nth-child(5)',
    actions: 'td:nth-child(6)',
  },

  // ------------------------
  // CELL HELPERS
  // ------------------------
  cell: {
    statusText: 'td:nth-child(3) p',
    nameText: 'td:nth-child(2) p',
    idText: 'td:nth-child(1) p',
    ownerText: 'td:nth-child(5) p',
  },

  // ------------------------
  // ACTIONS (inside last column)
  // ------------------------
  actions: {
    container: 'td:nth-child(6)',
    view: 'a:has-text("View")',
    edit: 'button:has-text("Edit")',
    execute: 'button:has-text("Execute")',
    copy: 'button:has-text("Copy")',
    delete: 'button:has-text("Delete")',
  },
};