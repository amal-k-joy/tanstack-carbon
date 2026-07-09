import React, { useState, useMemo, useEffect } from 'react';
import { TanstackTable } from '@/lib';
import { TrashCan, Download } from '@carbon/icons-react';
import { UnorderedList, ListItem } from '@carbon/react';
import commonStyles from './scss/common.module.scss';

/**
 * Example: TanStack Table with MIXED Custom Filters
 *
 * This example demonstrates mixing accordion sections with standalone filters.
 * Some filters are grouped in accordion sections, others are standalone.
 */

const SOURCE_DATA = [
  {
    id: 1,
    name: 'John Doe',
    age: 28,
    department: 'Engineering',
    salary: 75000,
    status: 'Active',
    verified: true,
  },
  {
    id: 2,
    name: 'Jane Smith',
    age: 34,
    department: 'Marketing',
    salary: 65000,
    status: 'Active',
    verified: true,
  },
  {
    id: 3,
    name: 'Bob Johnson',
    age: 45,
    department: 'Sales',
    salary: 80000,
    status: 'Inactive',
    verified: false,
  },
];

const ExampleWithMixedFilters = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);

  // Simulate API call with initial loading delay
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 3500));

      setFilteredData(SOURCE_DATA);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
      { accessorKey: 'department', header: 'Department' },
      {
        accessorKey: 'salary',
        header: 'Salary',
        cell: ({ getValue }) => `$${getValue().toLocaleString()}`,
      },
      { accessorKey: 'status', header: 'Status' },
      {
        accessorKey: 'verified',
        header: 'Verified',
        cell: ({ getValue }) => (getValue() ? '✓' : '✗'),
      },
    ],
    []
  );

  /**
   * MIXED FILTER CONFIG:
   * - Some filters are standalone (no accordion)
   * - Some filters are grouped in accordion sections
   */
  const customFilterConfig = useMemo(
    () => [
      // STANDALONE FILTER 1 (No Accordion)
      {
        id: 'quickSearch',
        type: 'text',
        label: '🔍 Quick Search (Name)',
        placeholder: 'Search by name...',
      },

      // ACCORDION SECTION 1
      {
        id: 'basic-filters-section',
        type: 'section', //  ← This creates an accordion
        label: 'Basic Filters',
        defaultOpen: true,
        filters: [
          {
            id: 'department',
            type: 'dropdown',
            label: 'Department (with counts)',
            options: [
              { value: 'Engineering', label: 'Engineering', count: 1 },
              { value: 'Marketing', label: 'Marketing', count: 1 },
              { value: 'Sales', label: 'Sales', count: 1 },
            ],
            placeholder: 'Select department',
          },
          {
            id: 'status',
            type: 'checkbox',
            label: 'Status (mixed - with and without counts)',
            options: [
              { value: 'Active', label: 'Active', count: 2 },
              { value: 'Inactive', label: 'Inactive' }, // No count
            ],
            defaultValue: [],
          },
        ],
      },

      // STANDALONE FILTER 2 (No Accordion)
      {
        id: 'verifiedStatus',
        type: 'radio',
        label: '✓ Verification Status (with counts)',
        options: [
          { value: 'all', label: 'All Users', count: 3 },
          { value: 'verified', label: 'Verified Only' },
          { value: 'unverified', label: 'Unverified Only', count: 1 },
        ],
        defaultValue: 'all',
      },

      // ACCORDION SECTION 2
      {
        id: 'salary-filters-section',
        type: 'section', // ← Another accordion
        label: 'Salary Filters',
        defaultOpen: false, // Collapsed by default
        filters: [
          {
            id: 'minSalary',
            type: 'number',
            label: 'Minimum Salary',
            placeholder: 'Enter minimum salary',
            min: 0,
            step: 1000,
            validation: {
              min: 0,
              custom: (value, allFilters) => {
                if (allFilters.maxSalary && value > allFilters.maxSalary) {
                  return false;
                }
                return true;
              },
              message: 'Min salary cannot exceed max salary',
            },
          },
          {
            id: 'maxSalary',
            type: 'number',
            label: 'Maximum Salary',
            placeholder: 'Enter maximum salary',
            min: 0,
            step: 1000,
            disabled: (allFilters) => !allFilters.minSalary,
          },
        ],
      },

      // STANDALONE FILTER 3 (No Accordion)
      {
        id: 'ageSlider',
        type: 'slider',
        label: 'Minimum Age',
        min: 20,
        max: 60,
        step: 1,
        defaultValue: 20,
        hideTextInput: false,
      },
    ],
    []
  );

  // Handle custom filter apply — filterValues is the flat filter state object.
  const handleCustomFiltersApply = (filterValues) => {
    let filtered = [...SOURCE_DATA];

    // Quick search
    if (filterValues.quickSearch) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(filterValues.quickSearch.toLowerCase())
      );
    }

    // Department
    if (filterValues.department) {
      filtered = filtered.filter(
        (item) => item.department === filterValues.department
      );
    }

    // Status
    if (filterValues.status && filterValues.status.length > 0) {
      filtered = filtered.filter((item) =>
        filterValues.status.includes(item.status)
      );
    }

    // Verification status
    if (filterValues.verifiedStatus === 'verified') {
      filtered = filtered.filter((item) => item.verified === true);
    } else if (filterValues.verifiedStatus === 'unverified') {
      filtered = filtered.filter((item) => item.verified === false);
    }
    // If "all", no filtering needed

    // Min salary
    if (filterValues.minSalary) {
      filtered = filtered.filter(
        (item) => item.salary >= filterValues.minSalary
      );
    }

    // Max salary
    if (filterValues.maxSalary) {
      filtered = filtered.filter(
        (item) => item.salary <= filterValues.maxSalary
      );
    }

    // Age slider
    if (filterValues.ageSlider) {
      filtered = filtered.filter((item) => item.age >= filterValues.ageSlider);
    }

    setFilteredData(filtered);
  };

  const handleCustomFiltersReset = () => {
    setFilteredData(SOURCE_DATA);
  };

  // Batch actions for selected rows
  const batchActions = [
    {
      label: 'Delete',
      icon: TrashCan,
      onClick: (selectedRows) => {
        alert(
          `Delete ${selectedRows.length} user(s)?\n\nSelected: ${selectedRows
            .map((r) => r.name)
            .join(', ')}`
        );
      },
    },
    {
      label: 'Export',
      icon: Download,
      onClick: (selectedRows) => {
        alert(
          `Exporting ${
            selectedRows.length
          } user(s)...\n\nSelected: ${selectedRows
            .map((r) => r.name)
            .join(', ')}`
        );
      },
    },
  ];

  return (
    <>
      <div className={commonStyles.pageHeader}>
        <div className="example-header">
          <h2 className="example-title">Mixed Custom Filters</h2>
          <p className="example-description">
            This example demonstrates mixing accordion sections with standalone
            filters:
          </p>
          <UnorderedList className={commonStyles.unorderedList}>
            <ListItem>
              <strong>Quick Search</strong> - Standalone filter (no accordion)
            </ListItem>
            <ListItem>
              <strong>Basic Filters</strong> - Accordion section (Department,
              Status)
            </ListItem>
            <ListItem>
              <strong>Verified Only</strong> - Standalone filter (no accordion)
            </ListItem>
            <ListItem>
              <strong>Salary Filters</strong> - Accordion section (Min/Max
              Salary)
            </ListItem>
            <ListItem>
              <strong>Minimum Age</strong> - Standalone filter (no accordion)
            </ListItem>
          </UnorderedList>
        </div>
      </div>

      <div className={commonStyles.pageBody}>
        <TanstackTable
          data={filteredData}
          columns={columns}
          isLoading={isLoading}
          toolbar={[{ type: 'filter' }, { type: 'search' }]}
          features={{
            selection: {
              type: 'radio',
              batchActions,
            },
            pagination: {
              pageSize: 10,
            },
            sideFilterPanel: {
              config: customFilterConfig,
              onApply: handleCustomFiltersApply,
              onReset: handleCustomFiltersReset,
            },
          }}
        />
      </div>
    </>
  );
};

export default ExampleWithMixedFilters;
