import React, { Dispatch, SetStateAction, useState, useRef } from 'react'
import cx from 'classnames'
import {
  DataTable,
  IconButton,
  Layer,
  Popover,
  PopoverContent,
  TextInput,
  Dropdown,
  ButtonSet,
  Button,
  Checkbox,
  NumberInput
} from '@carbon/react';
import { Filter } from '@carbon/react/icons';
const {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch
} = DataTable;

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  TableOptions,
  RowData,
  PartialKeys,
  TableOptionsResolved,
  FilterFn,
  getFilteredRowModel,
  ColumnFiltersState,
  Column,
  Header,
  getFacetedUniqueValues,
  ColumnFilter
} from '@tanstack/react-table'
import {
  rankItem,
} from '@tanstack/match-sorter-utils'

import { makeData } from './makeData';
import { TagOverflow, pkg } from '@carbon/ibm-products';

pkg.component.TagOverflow = true;

type Resource = {
  id: string
  name: string
  rule: string
  status: string
  other: string
  example: string
}

declare module "@tanstack/table-core" {
  interface TableOptions<TData extends RowData>
    extends PartialKeys<TableOptionsResolved<TData>, "state" | "onStateChange" | "renderFallbackValue"> {
    filterFns?: FilterFns;
  }

  interface FilterFns {
    fuzzy: FilterFn<unknown>;
  }

  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'range' | 'select' | 'checkbox' | 'number'
  }
}

// Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank,
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const columnHelper = createColumnHelper<Resource>()

const columns = [
  columnHelper.accessor(row => row.name, {
    id: 'name',
    cell: info => <i>{info.getValue()}</i>,
    header: () => <span>Name</span>,
  }),
  columnHelper.accessor('rule', {
    header: () => 'Rule',
    cell: info => info.renderValue(),
    filterFn: 'arrIncludesSome',
    meta: {
      filterVariant: 'checkbox',
    },
  }),
  columnHelper.accessor('status', {
    header: () => <span>Status</span>,
    meta: {
      filterVariant: 'select',
    },
  }),
  columnHelper.accessor('other', {
    header: 'Other',
  }),
  columnHelper.accessor('example', {
    header: 'Example',
    filterFn: 'weakEquals',
    meta: {
      filterVariant: 'number'
    }
  }),
]

export const WithFilterFlyout = () => {
  const [data] = useState(makeData(7))
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [localFilters, setLocalFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter, //define as a filter function that can be used in column definitions
    },
    state: {
      globalFilter,
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), //client side filtering
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'fuzzy', //apply fuzzy filter to the global filter (most common use case for fuzzy filter)
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  interface ExtendedColFilter extends ColumnFilter {
    label: string;
    onClose: () => void;
    filter: boolean;
  }

  const buildTagFilters = () => {
    const tagFilters = columnFilters.map((c: ExtendedColFilter) => {
      const buildTag = (col, checkboxParentColumnData?: ColumnFilter) => {
        const tagData = {} as ExtendedColFilter;
        tagData.label = typeof col === 'string' ? `${checkboxParentColumnData.id}: ${col}` : `${col.id}: ${col.value}`;
        tagData.onClose = () => {
          const foundLocalIndex = localFilters.findIndex(f => f.id === col.id && f.value === col.value);
          const foundColumnIndex = columnFilters.findIndex(f => f.id === col.id && f.value === col.value);
          const tempFilters = [...localFilters];
          const tempColumnFilters = [...columnFilters];
          if (foundColumnIndex > -1) {
            tempColumnFilters.splice(foundColumnIndex, 1);
            setColumnFilters(tempColumnFilters);
          }
          if (foundLocalIndex > -1) {
            tempFilters.splice(foundLocalIndex, 1);
            setLocalFilters(tempFilters);
          }
          const tableFullColumn = table.getColumn(col.id);
          tableFullColumn.setFilterValue(undefined);
        };
        tagData.filter = true;
        tagData.id = typeof col === 'string' ? col : col.id;
        return tagData
      }
      if (Array.isArray(c.value)) {
        return c.value.map(val => buildTag(val, c));
      }
      return buildTag(c);
    });
    return tagFilters.flat();
  };

  console.log('built tag filters; ', buildTagFilters());

  const returnFocusToFlyoutTrigger = () => {
    if (popoverRef?.current) {
      const triggerButton = popoverRef?.current.querySelector('button');
      triggerButton?.focus();
    }
  }

  const containerRef = useRef();
  const popoverRef = useRef<HTMLSpanElement>();

  return (
    <div ref={containerRef}>
      <TableContainer
        title="Filter flyout"
        className="basic-table tanstack-example filter-flyout-example"
        style={{
          width: table.getCenterTotalSize(),
        }}
      >
        <TableToolbar>
          <TableToolbarContent>
            <TableToolbarSearch
              defaultValue={globalFilter ?? ''}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setGlobalFilter(event.target.value)}
              placeholder="Search all columns..."
              persistent
            />
            <Layer>
              <Popover
                open={popoverOpen}
                isTabTip
                onRequestClose={() => {
                  setPopoverOpen(false)
                }}
                align='bottom-end'
                autoAlign
                ref={popoverRef}
              >
                <IconButton
                  onClick={() => setPopoverOpen(prev => !prev)}
                  label="Filter"
                  kind='ghost'
                >
                  <Filter />
                </IconButton>
                <PopoverContent>
                  <div className='flyout--container'>
                    <p className='flyout--label'>Filter</p>
                    <div className="flyout--container__filters">
                      {table.getHeaderGroups().map((headerGroup, index) => (
                        <React.Fragment key={index}>
                          {headerGroup.headers.map((header, index) => {
                            if (header.column.getCanFilter()) {
                              return <div className="filter-flyout-item" key={index}>
                                {popoverOpen && (
                                  <FilterColumn
                                    header={header}
                                    column={header.column}
                                    setLocalFilters={setLocalFilters}
                                    localFilters={localFilters}
                                  />
                                )}
                              </div>
                            }
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <ButtonSet className='filter-flyout-button-set'>
                    <Button kind="secondary" onClick={() => {
                      table.resetColumnFilters();
                      setPopoverOpen(false);
                      returnFocusToFlyoutTrigger()
                    }}>
                      Clear
                    </Button>
                    <Button
                      kind="primary"
                      onClick={() => {
                        setColumnFilters(localFilters);
                        setPopoverOpen(false);
                        returnFocusToFlyoutTrigger()
                      }}
                    >
                      Filter
                    </Button>
                  </ButtonSet>
                </PopoverContent>
              </Popover>
            </Layer>
          </TableToolbarContent>
        </TableToolbar>
        {buildTagFilters().length ? (
          <div className='filter--summary'>
            <TagOverflow 
              className={cx({['tag-overflow-flyout-example']: buildTagFilters().length})}
              // @ts-expect-error `filter` should be boolean in tag overflow component
              items={buildTagFilters()}
              containingElementRef={containerRef}
            />
            <Button kind='ghost' onClick={() => {
              setLocalFilters([]);
              table.resetColumnFilters()
            }}>Clear filters</Button>
          </div>
        ): null}
        <Table
          size="lg"
          useZebraStyles={false}
          aria-label="sample table"
        >
          <TableHead>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHeader
                    key={header.id}
                    style={{
                      width: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHeader>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    style={{
                      width: cell.column.getSize(),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  )
}

const FilterColumn = (
  { column, header, setLocalFilters, localFilters }:
  {
    column: Column<any, unknown>,
    header: Header<any, unknown>,
    setLocalFilters: Dispatch<SetStateAction<ColumnFiltersState>>,
    localFilters: ColumnFiltersState,
  }) => {
  const { filterVariant } = column.columnDef.meta ?? {}

  const sortedUniqueValues = React.useMemo(
    () =>
      filterVariant === 'range'
        ? []
        : Array.from(column.getFacetedUniqueValues().keys())
            .sort()
            .slice(0, 5000),
    [filterVariant, column]
  )
  console.log('local filters: ', localFilters);

  const getCheckboxState = (value) => {
    const foundFilter = localFilters.find(c => c.id === column.id);
    const isChecked = foundFilter ? (localFilters.find(c => c.id === column.id)?.value as string[]).includes(value) : false;
    return !!isChecked;
  }

  return filterVariant === 'select' ? (
    <Layer>
      <Dropdown
        id="dropdown-filter"
        titleText={`Filter ${column.id}`}
        label="Choose a status"
        items={sortedUniqueValues}
        initialSelectedItem={localFilters.find(c => c.id === column.id)?.value as string}
        renderSelectedItem={() => <div className='flyout-dropdown-selected-item'>{localFilters.find(c => c.id === column.id)?.value as string}</div>}
        itemToElement={(item: { value: any }) => <div className='flyout-dropdown-selected-item'>{item.value}</div>}
        onChange={({ selectedItem }) => {
          const temp = [...localFilters]
          const foundIndex = temp.findIndex(c => c.id === column.id);
          if (foundIndex > -1) {
            temp.splice(foundIndex, 1);
            temp.push({ id: column.id, value: selectedItem });
            console.log('temp', temp);
            setLocalFilters(temp);
            return;
          }
          setLocalFilters([...temp, { id: column.id, value: selectedItem }])
        }}
      />
    </Layer>
  ) : filterVariant === 'checkbox' ? (
    <Layer>
      <p className='filter-checkbox-group-label'>{column.id}</p>
      {sortedUniqueValues.map((value: string) => (
        <Checkbox
          key={value}
          id={value}
          labelText={value}
          checked={getCheckboxState(value)}
          onChange={(event, { checked, id }) => {
            const temp = [...localFilters];
            const foundLocalFilter = temp.filter(f => f.id === column.id);
            const foundFilterIndex = foundLocalFilter.length ? temp.findIndex(f => f.id === foundLocalFilter[0].id) : -1;
            // This means there is only one checkbox selected
            if (checked) {
              if (foundFilterIndex > -1) {
                const foundFilterValues = foundLocalFilter[0].value as [];
                temp.splice(foundFilterIndex, 1);
                temp.push({ id: column.id, value: [...foundFilterValues, id] });
                setLocalFilters(temp);
                return;
              }
              setLocalFilters([...temp, { id: column.id, value: [ id ] }]);
              return;
            }
            if (!checked) {
              if (foundFilterIndex > -1) {
                const foundFilterValues = foundLocalFilter[0].value as [];
                const newFoundFilterValues = foundFilterValues.filter(item => item !== id);
                temp.splice(foundFilterIndex, 1);
                if (newFoundFilterValues && newFoundFilterValues.length) {
                  temp.push({ id: column.id, value: newFoundFilterValues });
                }
                setLocalFilters(temp);
              }
            }
          }}
        />
      ))}
    </Layer>
  ) : filterVariant === 'number' ? (
    <Layer>
      <NumberInput
        id={column.id}
        // value={(columnFilterValue ?? 0) as number}
        value={localFilters.find(c => c.id === column.id)?.value as number}
        hideSteppers
        label={column.id}
        onChange={(event, { value }) => {
          const temp = [...localFilters];
          const foundLocalFilter = temp.filter(f => f.id === column.id);
          const foundFilterIndex = foundLocalFilter.length ? temp.findIndex(f => f.id === foundLocalFilter[0].id) : -1;
          if (foundFilterIndex > -1) {
            temp.splice(foundFilterIndex, 1);
            temp.push({ id: column.id, value });
            setLocalFilters(temp)
            return;
          } else {
            setLocalFilters([...temp, { id: column.id, value }])
            return;
          }
        }}
      />
    </Layer>
  ) : (
    <Layer>
      <TextInput
        onChange={event => {
          // column.setFilterValue(event.target.value) // instant filter option
          const temp = [...localFilters];
          const foundLocalFilter = temp.filter(f => f.id === column.id);
          const foundFilterIndex = foundLocalFilter.length ? temp.findIndex(f => f.id === foundLocalFilter[0].id) : -1;
          console.log(foundFilterIndex, event.target.value);
          if (foundFilterIndex > -1) {
            temp.splice(foundFilterIndex, 1);
            temp.push({ id: column.id, value: event.target.value });
            setLocalFilters(temp);
            return;
          } else {
            setLocalFilters([...temp, { id: column.id, value: event.target.value }]);
            return;
          }
        }}
        placeholder={`Filter ${column.id}`}
        type="text"
        value={localFilters.find(c => c.id === column.id)?.value as string ?? ''}
        labelText={flexRender(
          header.column.columnDef.header,
          header.getContext()
        )}
        id={column.id}
      />
    </Layer>
  )
}