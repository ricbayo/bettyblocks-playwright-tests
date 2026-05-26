# Copilot Instructions – Betty Blocks Playwright Framework

## Purpose

This file defines strict rules for AI agents (Copilot / code generators / assistants) working in this repository.

The goal is to ensure:

* Consistent Playwright architecture
* Zero duplication
* Stable, maintainable tests
* Strict POM enforcement

---

# Core Principles (NON-NEGOTIABLE)

## 1. Page Object Model (POM) ONLY

* All UI interactions must be inside Page Objects
* Tests must NEVER contain locators
* Tests must only call business methods

Examples of allowed methods:

* createProject()
* editProject()
* closeProject()
* createTask()
* completeTask()

---

## 2. No Selectors in Tests

* NEVER use page.locator() in spec files
* NEVER use CSS/XPath in tests
* All selectors must come from `utils/selectors.ts`

---

## 3. Authentication Rule

* Login is handled ONLY in `global.setup.ts`
* Tests must use `storageState`
* NEVER implement login inside Page Objects or specs

---

## 4. Separation of Concerns

### pages/

* UI interaction logic only
* No test assertions (except simple visibility checks)
* No test data logic

### specs/

* Business scenarios only
* Assertions only here
* No UI implementation details

### utils/

* selectors.ts = single source of truth
* helpers.ts = reusable logic only

### fixtures/

* test data generators only
* unique naming helpers

---

# Selector Strategy

Priority order:

1. data-testid (preferred)
2. getByRole
3. getByLabel
4. CSS fallback (last resort)

Rules:

* NEVER use Betty Blocks dynamic class names
* NEVER duplicate selectors across files
* ALL selectors must be centralized

---

# Risk-Based Testing Strategy

## 🔴 Critical

Must be fully automated with edge cases:

* Create Project
* Edit Project
* Delete Project
* Create Task
* Edit Task
* Complete Task
* Close Project
* Copy Project

---

## 🟡 High

* Relationship validation (Project ↔ Tasks)
* Copy logic verification
* Form validation handling

---

## 🔵 Medium

* Navigation flows
* Soft delete behavior
* User scoping checks

---

## ⚪ Low

* UI visuals (badges, icons, KPI counters)
* Manual-only validation

---

# Coding Rules for Agents

## DO

* Reuse existing Page Objects
* Extend classes instead of creating duplicates
* Use business language methods only
* Keep methods small and reusable
* Follow existing folder structure strictly

## DO NOT

* Add new selector logic in tests
* Create new login flows
* Duplicate Page Objects
* Write generic methods like clickButton()
* Hardcode test data

---

# Test Writing Rules

* Use TC-01, TC-02 naming convention
* Each test must validate ONE business flow
* Avoid multi-feature tests unless integration layer
* Assertions must be meaningful (not UI-only)

---

# Execution Flow

1. global.setup.ts handles authentication
2. storageState is reused for all tests
3. tests call Page Object methods only
4. ass
