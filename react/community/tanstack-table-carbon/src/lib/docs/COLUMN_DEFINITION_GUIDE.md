# Column Definition Guide

This document explains every key in a TanstackTable column definition object — what each one does, when to use it, and real examples.

---

## Table of Contents

1. [Identity Keys](#1-identity-keys)
2. [Value Accessor Keys](#2-value-accessor-keys)
3. [Display Keys](#3-display-keys)
4. [Sorting Keys](#4-sorting-keys)
5. [Filtering Keys](#5-filtering-keys)
6. [Size Keys](#6-size-keys)
7. [Meta Keys](#7-meta-keys)
8. [Decision Rules](#8-decision-rules)
9. [Common Patterns](#9-common-patterns)

---

## 1. Identity Keys

### `id`

Explicitly sets the column's unique identifier.

**When to use:**

- Column has no direct data field (action columns, computed columns, selection, expand)
- Column uses `accessorFn` but has no `accessorKey`

```js
{ id: 'overflow-menu', cell: ({ row }) => <OverflowMenu /> }
{ id: 'fullName', accessorFn: (row) => `${row.firstName} ${row.lastName}` }
```

> **Rule:** If you use `accessorFn` without `accessorKey`, you **must** provide `id` — TanStack throws an error otherwise.

---

### `accessorKey`

Derives the column id **and** the default accessor from a data object property name.

**When to use:**

- Column maps directly to a property on your data object
- You want the column id to match the data field name

```js
{
  accessorKey: 'email';
}
// id = 'email', row.getValue() = row.original.email
```

**When used alongside `accessorFn`:**
`accessorKey` still provides the column `id` and keeps `row.original[accessorKey]` accessible, but `accessorFn` takes over what `row.getValue()` returns.

```js
{
  accessorKey: 'joinDate',               // → id = 'joinDate', row.original.joinDate = raw ISO
  accessorFn: (row) => formatDate(row.joinDate), // → row.getValue() = "Jan 15, 2022"
}
```

> **TanStack resolution order:** `id` → `accessorKey` → `header` (if string)

---

## 2. Value Accessor Keys

### `accessorFn`

A function that computes the value for `row.getValue(columnId)`.

**When to use:**

- You need to transform or format the raw value for display and global search
- The value is computed from multiple fields

```js
// Formatted display + searchable by month name ("jan", "2022")
{
  accessorKey: 'joinDate',
  accessorFn: (row) => formatDateForDisplay(row.joinDate),
}

// Computed from two fields
{
  id: 'fullName',
  accessorFn: (row) => `${row.firstName} ${row.lastName}`,
}
```

> **Important:** When `accessorFn` is used, `row.getValue()` returns the computed value — not `row.original[accessorKey]`. If you need the raw value (e.g. in `filterFn`, `sortingFn`, editable cells), always read from `row.original` directly.

---

## 3. Display Keys

### `header`

The column header label. Can be a string or a React component.

```js
{
  header: 'Join Date';
}
{
  header: () => (
    <span>
      Join Date <InfoIcon />
    </span>
  );
}
```

### `cell`

Renders the cell content. Receives `{ getValue, row, cell, column, table }`.

```js
// Simple formatted value
{ cell: ({ getValue }) => `$${getValue().toLocaleString()}` }

// JSX with row data
{ cell: ({ row }) => <Tag type="green">{row.original.status}</Tag> }

// When accessorFn already formats — just pass through
{ accessorFn: (row) => formatDate(row.date), cell: ({ getValue }) => getValue() }
```

---

## 4. Sorting Keys

### `enableSorting`

Whether the column is sortable. Defaults to `true`.

```js
{
  enableSorting: false;
} // disables sort on this column
```

### `sortingFn`

Custom sort comparator. Receives `(rowA, rowB, columnId)`, returns `-1 | 0 | 1`.

**When to use:**

- You use `accessorFn` that changes what `row.getValue()` returns (e.g. display strings), so TanStack's default sort would sort by the display value instead of the raw value
- You need locale-aware, numeric, or null-handling sort logic

```js
// Date column using accessorFn for display — sort by raw ISO string
{
  accessorKey: 'joinDate',
  accessorFn: (row) => formatDate(row.joinDate),  // row.getValue() = "Jan 15, 2022"
  sortingFn: (rowA, rowB) =>
    (rowA.original.joinDate ?? '').localeCompare(rowB.original.joinDate ?? ''),
}
```

> **Rule:** If you don't use `accessorFn`, you don't need `sortingFn` — TanStack's `alphanumeric` default handles ISO date strings, numbers, and text correctly.

Built-in values: `'alphanumeric'` (default), `'alphanumericCaseSensitive'`, `'text'`, `'datetime'`, `'basic'`.

> **Note:** `sortingFn: 'datetime'` expects `row.getValue()` to return a `Date` object or timestamp — not a formatted string.

---

## 5. Filtering Keys

### `enableColumnFilter`

Whether the column appears in the side filter panel. Defaults to `true` (if `accessorFn` or `accessorKey` is set).

```js
{
  enableColumnFilter: false;
} // hide from filter panel
```

### `enableGlobalFilter`

Whether the column participates in the toolbar global search. Defaults to `true`.

```js
{
  enableGlobalFilter: false;
} // exclude from search
```

### `filterFn`

Custom column filter function used by the side filter panel. Receives `(row, columnId, filterValue)`.

**When to use:**

- Columns with `filterVariant: 'dateRange'` or `'date'` — the library auto-injects the correct `filterFn` via `enhanceColumnsWithSmartFiltering`
- You need custom matching logic (partial match, case-sensitive, etc.)

> **Important:** The library's auto-injected `filterFn` for date variants reads `row.original[accessorKey]` — not `row.getValue()` — so it always gets the raw value regardless of `accessorFn`.

> **Note:** `filterFn` is **only** used for column filters (side panel). Global search uses `globalFilterFn` which is separate (`includesString` by default — calls `row.getValue().toString()`).

---

## 6. Size Keys

### `size`

Column width in pixels.

```js
{
  size: 150;
}
```

### `minSize` / `maxSize`

Min/max column width constraints (used with column resizing).

---

## 7. Meta Keys

### `meta`

Arbitrary metadata consumed by the library for filter panel and editable cell features.

| Key                         | Type       | Description                                                                                                                                           |
| --------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `filterVariant`             | `string`   | Filter UI type: `'text'`, `'select'`, `'multiselect'`, `'checkbox'`, `'radio'`, `'date'`, `'dateRange'`, `'time'`, `'slider'`, `'number'`, `'toggle'` |
| `editable`                  | `boolean`  | Enables inline cell editing                                                                                                                           |
| `editableType`              | `string`   | Edit widget: `'text'` (default), `'select'`, `'date'`                                                                                                 |
| `options`                   | `string[]` | Dropdown options for `editableType: 'select'`                                                                                                         |
| `validate`                  | `Function` | `(value) => true                                                                                                                                      | 'error message'` — validates edited cell value |
| `showInColumnCustomization` | `boolean`  | Show/hide in column customization panel (default `true`)                                                                                              |

```js
meta: {
  filterVariant: 'dateRange',
  editable: true,
  editableType: 'date',
}
```

---

## 8. Decision Rules

### Which identity key to use?

```
Column maps to a data field?
  └── Yes → use accessorKey
        └── Also need custom getValue()? → add accessorFn alongside
  └── No  → use id  (action cols, computed cols, select, expand)
```

### Do you need sortingFn?

```
Using accessorFn that changes the value format?
  └── Yes → provide sortingFn that reads row.original for the raw value
  └── No  → skip it, TanStack's default works correctly
```

### Do you need filterFn?

```
filterVariant is 'date' or 'dateRange'?
  └── Library auto-injects the correct filterFn — no action needed

filterVariant is anything else with a cell formatter?
  └── Library auto-injects a filterFn that checks raw + formatted value

Need completely custom matching logic?
  └── Provide your own filterFn — library skips injection if filterFn exists
```

---

## 9. Common Patterns

### Plain text column

```js
{
  accessorKey: 'email',
  header: 'Email',
  enableSorting: true,
  enableColumnFilter: true,
  meta: { filterVariant: 'text' },
  size: 220,
}
```

### JSX cell with tag (no sortingFn needed — raw value still searched/sorted)

```js
{
  accessorKey: 'status',
  header: 'Status',
  enableSorting: true,
  enableColumnFilter: true,
  meta: { filterVariant: 'checkbox' },
  cell: ({ getValue }) => <Tag type="green">{getValue()}</Tag>,
  size: 120,
}
```

### Date column with display formatting + global search + side panel filter

```js
{
  accessorKey: 'joinDate',          // id = 'joinDate', row.original.joinDate = "2022-01-15"
  accessorFn: (row) =>              // row.getValue() = "Jan 15, 2022" — searchable by "jan"
    formatDateForDisplay(row.joinDate),
  sortingFn: (rowA, rowB) =>        // sort by raw ISO string, not display string
    (rowA.original.joinDate ?? '').localeCompare(rowB.original.joinDate ?? ''),
  header: 'Join Date',
  enableSorting: true,
  enableColumnFilter: true,
  meta: { filterVariant: 'dateRange' },  // library auto-injects filterFn via row.original
  cell: ({ getValue }) => getValue(),
  size: 150,
}
```

### Computed column (no data field)

```js
{
  id: 'fullName',
  accessorFn: (row) => `${row.firstName} ${row.lastName}`,
  header: 'Full Name',
  enableSorting: true,
  size: 180,
}
```

### Action / display-only column

```js
{
  id: 'overflow-menu',
  header: '',
  enableSorting: false,
  enableColumnFilter: false,
  meta: { showInColumnCustomization: false },
  cell: ({ row }) => <OverflowMenu row={row} />,
  size: 50,
}
```
