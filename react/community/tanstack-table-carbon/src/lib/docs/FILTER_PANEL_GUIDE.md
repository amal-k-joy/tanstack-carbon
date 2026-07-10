# Filter Panel Guide

This document covers the side filter panel feature — both **column-based filters** (auto-generated from column definitions) and **custom filters** (fully consumer-owned configuration).

---

## Table of Contents

1. [Overview](#1-overview)
2. [Enabling the Panel](#2-enabling-the-panel)
3. [sideFilterPanel Options](#3-sideFilterPanel-options)
4. [Column-Based Filters](#4-column-based-filters)
5. [Custom Filter Config](#5-custom-filter-config)
6. [Custom Filter Types](#6-custom-filter-types)
7. [Accordion Sections](#7-accordion-sections)
8. [Toolbar Behaviour](#8-toolbar-behaviour)
9. [Filter Tag Chips](#9-filter-tag-chips)

---

## 1. Overview

The filter panel slides in from the left when the user clicks the toolbar filter icon. It has two modes:

| Mode               | When                    | Who filters data              |
| ------------------ | ----------------------- | ----------------------------- |
| **Column-based**   | No `config` provided    | TanStack Table (client-side)  |
| **Custom filters** | `config` array provided | Consumer's `onApply` callback |

---

## 2. Enabling the Panel

Add `{ type: 'filter' }` to the `toolbar` array **and** set `features.sideFilterPanel`:

```jsx
<TanstackTable
  data={data}
  columns={columns}
  toolbar={[{ type: 'filter' }, { type: 'search' }]}
  features={{
    sideFilterPanel: {
      // options — see section 3
    },
  }}
/>
```

---

## 3. sideFilterPanel Options

| Prop                    | Type                           | Default | Description                                                                         |
| ----------------------- | ------------------------------ | ------- | ----------------------------------------------------------------------------------- |
| `width`                 | `number`                       | `350`   | Panel width in pixels                                                               |
| `hideSearch`            | `boolean`                      | `false` | Hide the search box inside the panel header                                         |
| `onAdvancedFilterClick` | `() => void`                   | —       | Shows an "Advanced filters" link; called on click                                   |
| `config`                | `CustomFilterConfigEntry[]`    | —       | Custom filter config (see sections 5–7). If omitted, column-based filters are shown |
| `onApply`               | `(filterValues, meta) => void` | —       | Required when `config` is provided. Called on Apply                                 |
| `onReset`               | `(filterValues, meta) => void` | —       | Required when `config` is provided. Called on Clear                                 |

### `onApply` / `onReset` signature

```js
onApply(filterValues, { changedFilters });
// filterValues  — flat object: { name: 'John', status: ['Active'], minSalary: 50000 }
// changedFilters — array of keys that changed since last apply
```

### `hideSearch` example

```jsx
features={{
  sideFilterPanel: {
    hideSearch: true,
    config: customFilterConfig,
    onApply: handleApply,
    onReset: handleReset,
  },
}}
```

---

## 4. Column-Based Filters

When no `config` is provided, the panel auto-generates filter controls from column definitions that have `enableColumnFilter: true` and a `meta.filterVariant`.

Filter variants available:

| `filterVariant` | Control               | Filter value type            |
| --------------- | --------------------- | ---------------------------- |
| `'text'`        | Text input            | `string`                     |
| `'select'`      | Dropdown              | `string`                     |
| `'checkbox'`    | Checkbox group        | `string[]`                   |
| `'multiselect'` | Multi-select dropdown | `string[]`                   |
| `'radio'`       | Radio group           | `string`                     |
| `'number'`      | Number input          | `number`                     |
| `'slider'`      | Range slider          | `{ min, max }`               |
| `'date'`        | Date picker           | `Date` object                |
| `'dateRange'`   | Date range picker     | `{ start: Date, end: Date }` |
| `'time'`        | Time picker           | `string` (`"HH:MM"`)         |
| `'toggle'`      | Toggle switch         | `boolean`                    |

The library auto-injects the correct `filterFn` for `date` and `dateRange` variants. For other variants with `cell` formatters, a smart filter is also injected automatically.

---

## 5. Custom Filter Config

When `config` is provided, the panel renders your filter definitions instead of column controls. Each entry in `config` is either a **standalone filter item** or an **accordion section** (see section 7).

```jsx
const customFilterConfig = [
  // Standalone (no accordion)
  { id: 'name', type: 'text', label: 'Name' },

  // Accordion section
  {
    id: 'salary-section',
    type: 'section',
    label: 'Salary Filters',
    defaultOpen: true,
    filters: [
      { id: 'minSalary', type: 'number', label: 'Min Salary', min: 0 },
      { id: 'maxSalary', type: 'number', label: 'Max Salary', min: 0 },
    ],
  },
];
```

---

## 6. Custom Filter Types

All filter items share these base fields:

| Field          | Type                                 | Required | Description                                    |
| -------------- | ------------------------------------ | -------- | ---------------------------------------------- |
| `id`           | `string`                             | ✅       | Unique key — used as the key in `filterValues` |
| `type`         | `string`                             | ✅       | Filter control type (see below)                |
| `label`        | `string`                             | ✅       | Label shown above the control                  |
| `defaultValue` | any                                  |          | Initial value                                  |
| `disabled`     | `boolean \| (allFilters) => boolean` |          | Disable the control (can be dynamic)           |
| `validation`   | `FilterValidation`                   |          | Validation rules (see below)                   |

### `text`

```js
{ id: 'name', type: 'text', label: 'Name', placeholder: 'Search...' }
```

### `checkbox`

```js
{ id: 'status', type: 'checkbox', label: 'Status', options: [
  { value: 'Active', label: 'Active', count: 4 },
  { value: 'Inactive', label: 'Inactive' },
], defaultValue: [] }
```

### `dropdown`

```js
{ id: 'dept', type: 'dropdown', label: 'Department', placeholder: 'Select...', options: [...] }
```

### `radio`

```js
{ id: 'type', type: 'radio', label: 'Employee Type', options: [...], defaultValue: 'all' }
```

### `number`

```js
{
  id: 'minSalary', type: 'number', label: 'Min Salary',
  min: 0, step: 1000,
  disabled: (allFilters) => false,
  validation: { min: 0, custom: (val, all) => val <= all.maxSalary, message: 'Cannot exceed max' },
}
```

### `slider`

Single-value threshold slider (not a range). Emits a single `number`.

```js
{ id: 'ageSlider', type: 'slider', label: 'Minimum Age', min: 20, max: 60, step: 1, defaultValue: 20 }
```

> **Note:** This is different from column-based `filterVariant: 'slider'` which produces `{ min, max }`. This custom slider emits a single threshold number.

### `date`

```js
{ id: 'startDate', type: 'date', label: 'From Date' }
// filterValues.startDate → Date object (from Flatpickr)
```

### `dateRange`

```js
{ id: 'period', type: 'dateRange', label: 'Date Range' }
// filterValues.period → { start: Date, end: Date }
```

### `time`

```js
{ id: 'shiftTime', type: 'time', label: 'Shift Start' }
// filterValues.shiftTime → "09:00 AM"
```

### `multiselect`

```js
{ id: 'skills', type: 'multiselect', label: 'Skills', options: [...], placeholder: 'Select skills',
  validation: { min: 1, max: 3, message: 'Select 1–3 skills' } }
```

### `toggle`

```js
{ id: 'verified', type: 'toggle', label: 'Verified Only' }
// filterValues.verified → true | false
```

### `FilterValidation`

| Field     | Type                             | Description                                              |
| --------- | -------------------------------- | -------------------------------------------------------- |
| `min`     | `number`                         | Minimum numeric value (for `number`/`multiselect` count) |
| `max`     | `number`                         | Maximum numeric value (for `number`/`multiselect` count) |
| `custom`  | `(value, allFilters) => boolean` | Custom validation — return `false` to show error         |
| `message` | `string`                         | Error message shown when validation fails                |

---

## 7. Accordion Sections

Wrap filters in an accordion section using `type: 'section'`:

```js
{
  id: 'advanced-section',
  type: 'section',
  label: 'Advanced Filters',
  defaultOpen: false,      // collapsed by default
  filters: [
    { id: 'dept', type: 'dropdown', label: 'Department', options: [...] },
    { id: 'role', type: 'radio', label: 'Role', options: [...] },
  ],
}
```

Standalone filters (no accordion) and sections can be **mixed** in the same `config` array.

---

## 8. Toolbar Behaviour

The `toolbar` prop controls what appears in the table toolbar. Passing `null`, `undefined`, or `[]` hides the toolbar entirely.

| Value                                                                              | Result                          |
| ---------------------------------------------------------------------------------- | ------------------------------- |
| `null` / `undefined` / `[]`                                                        | No toolbar rendered             |
| `[{ type: 'filter' }]`                                                             | Filter icon only                |
| `[{ type: 'filter' }, { type: 'search' }]`                                         | Filter + search                 |
| `[{ type: 'filter' }, { type: 'search' }, { type: 'settings', menuItems: [...] }]` | Filter + search + settings gear |

---

## 9. Filter Tag Chips

Active filters are shown as dismissible tag chips below the toolbar. Each chip has an × to remove that individual filter.

- **Column filters** — one chip per active filter value (arrays produce one chip per item)
- **Custom filters** — one chip per non-empty key in `filterValues`
- **Slider (column-based)** — single chip showing `"Column: min – max"`
- **DateRange** — single chip showing `"Column: Jan 1, 2024 – Dec 31, 2024"`
- **"Clear filters"** button clears all column and custom filters at once
