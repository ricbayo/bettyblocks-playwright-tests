# Betty Blocks Playwright Automation Framework

## Overview

This framework is a Playwright + TypeScript automation setup for testing a Tasks Manager application built on Betty Blocks.

It is designed for:

* Scalable test architecture
* Low flakiness execution
* Risk-based coverage strategy
* Strict separation of concerns (POM + Specs + Utils)

---

# Core Architecture

## Tech Stack

* Playwright
* TypeScript
* Page Object Model (POM)
* StorageState authentication
* Risk-based testing

---

# Authentication

Authentication is handled ONLY via global setup.

## Flow

1. Open OAuth URL
2. Login through FusionAuth
3. Save session state
4. Reuse session in all tests

## Rules

* NEVER add login steps in tests
* NEVER repeat authentication logic in page objects

## Storage File

```
tests/.auth/user.json
```

---

# Folder Responsibilities

## pages/

Contains ONLY Page Objects

Rules:

* No test logic
* No assertions (except basic visibility checks)
* No raw selectors (must use selectors.ts)
* No waits except framework-managed waits

Example methods:

* createProject()
* editProject()
* closeProject()
* createTask()
* completeTask()

---

## specs/

Contains ONLY test cases

Rules:

* No selectors
* No page.locator()
* No login steps
* Only business-level methods from Page Objects
* Follow TC-01, TC-02 naming

---

## utils/selectors.ts

Single source of truth for selectors.

### Selector Priority

1. data-testid (preferred)
2. getByRole
3. getByLabel
4. CSS fallback (last resort)

### Rules

* Never use dynamic Betty Blocks class names
* Never duplicate selectors across pages

Avoid putting these in selectors.ts:
* chained locators (.locator(...))
* structural DOM logic (tbody tr:not(:first-child))
* .first(), .nth(), .filter()

Only put:
* stable attributes
* text patterns
* role-based selectors

---

## fixtures/

Used for:

* Unique test data
* Reusable builders
* Shared setup objects

Examples:

* projectFixtures.uniqueName()
* taskFixtures.uniqueName()

---

# Application Coverage

## Dashboard (/home)

Validations:

* Total Projects
* Open Tasks
* Overdue Tasks
* High Priority Tasks

Components:

* Priority Tasks Table
* Quick Actions (View, Close)

---

## Projects (/projects)

Features:

* Create Project (modal)
* Projects table

Columns:

* ID
* Name
* Status
* Deadline
* Owner
* Actions

Actions:

* View → Project Details
* Edit → Edit modal
* Close → Close project
* Copy → projectname_copy
* Delete → Remove project

---

## Project Details (/projects/:id)

Features:

* Edit Project
* Close Project
* Project metadata
* Tasks table
* Add Task (modal)

Task Actions:

* View → Task Details
* Edit → Edit modal
* Complete
* Delete

---

## Tasks (/tasks)

Features:

* Create Task
* Tasks table

Columns:

* ID
* Name
* Assignee
* Priority
* Status
* Execution Date
* Deadline
* Project
* Actions

Actions:

* View → Task Details
* Edit
* Complete
* Delete

---

## Task Details

Fields:

* Description
* Project
* Assigned To
* Execution Date
* Deadline
* Created Date

Actions:

* Edit
* Complete
* Delete

---

# Modal Specifications

## Create Project Modal

* Name (required)
* Description
* Status (default: New, disabled)
* Deadline (required)
* Owner (default: current user)
* Cancel / Create

---

## Edit Project Modal

* Same as Create Project
* Status becomes editable

---

## Create Task Modal

* Name (required)
* Description
* Project (required)
* Assigned To
* Priority (default: Low)
* Status (default: To Do)
* Execution Date
* Deadline
* Cancel / Create

---

## Edit Task Modal

* Same as Create Task
* Project is disabled

---

## Add Task Modal (Project Context)

* Same as Create Task
* Project preselected + disabled

---

# Risk-Based Testing Strategy

## 🔴 Critical

* Create Project
* Create Task
* Close Project
* Close Task
* Edit Project
* Edit Task
* Copy Project (projectname_copy)
* Delete Project
* Delete Task

Requirements:

* Full automation
* Edge cases included
* Strong validation coverage

---

## 🟡 High

* Copy Project flows
* Validation handling
* Relationship verification (Project ↔ Tasks)

---

## 🔵 Medium

* Soft delete behavior
* Navigation flows
* Current user scoping

---

## ⚪ Low (Manual Only)

* KPI counts
* Badge colors
* Icons/UI visuals

---

# Test Layers

## Smoke (per deployment)

* Login validation
* Create project
* Create task

---

## Functional (per PR)

* CRUD operations
* Validations
* Status transitions

---

## Integration (nightly)

* Cascading actions
* Copy loops
* Cross-entity relations

---

## Isolation (weekly / pre-release)

* Multi-user scenarios
* Data separation validation

---

# Naming Conventions

## Tests

TC-01, TC-02, TC-03...

## Page Methods

Must be business language only:

* createProject()
* closeProject()
* copyProject()
* createTask()
* completeTask()

## Forbidden

* clickButton()
* fillInput()
* generic automation naming

---

# Execution Rules

1. Authentication runs in global.setup.ts only
2. Storage state is reused in all tests
3. Page Objects handle all UI actions
4. Specs only describe business flows
5. Assertions happen in specs only

---

# Agent Rules

When generating or modifying code:

* Extend existing Page Objects first
* Never duplicate selectors
* Always use selectors.ts
* Always reuse fixtures
* Never introduce login flows in tests
* Follow existing architecture strictly

If unsure:
Always refer to this framework.md first

---

# Summary

This framework ensures:

* High maintainability
* Low test flakiness
* Strong separation of concerns
* Scalable automation across Projects and Tasks modules

It prioritizes **business logic validation over UI implementation details**.
