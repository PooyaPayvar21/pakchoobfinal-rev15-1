/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FiFilter } from "react-icons/fi";
import Header from "../components/Common/Header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TreemapOverview from "../components/Charts/TreemapOverview";
import PieChartOverview from "../components/Charts/PieChartOverview";
import AreaChartOverview from "../components/Charts/AreaChartOverview";
import LineChartOverview from "../components/Charts/LineChartOverview";
import BarChartOverview from "../components/Charts/BarChartOverview";
import * as XLSX from "xlsx";
import PropTypes from "prop-types";

// Chart Filter Component
const ChartFilterControls = ({
  chartId,
  availableLabels = [],
  selectedLabels = [],
  onFilterChange,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleLabel = useCallback(
    (label) => {
      const newLabels = selectedLabels.includes(label)
        ? selectedLabels.filter((l) => l !== label)
        : [...selectedLabels, label];
      onFilterChange(chartId, "selectedLabels", newLabels);
    },
    [chartId, onFilterChange, selectedLabels]
  );

  // Memoize the filter controls to prevent unnecessary re-renders
  const filterControls = useMemo(
    () => (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Filter options"
        >
          <FiFilter className="mr-1" />
          <span>Filters</span>
          {selectedLabels.length > 0 && (
            <span
              className="ml-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full"
              aria-label={`${selectedLabels.length} active filters`}
            >
              {selectedLabels.length}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="filter-menu"
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <h4
                  className="text-sm font-medium text-gray-900 dark:text-white"
                  id="filter-menu"
                >
                  Filter by Label
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReset(chartId);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  aria-label="Reset filters"
                >
                  Reset
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {availableLabels.map((label) => (
                  <div key={label} className="flex items-center py-1">
                    <input
                      id={`${chartId}-${label}`}
                      type="checkbox"
                      checked={selectedLabels.includes(label)}
                      onChange={() => toggleLabel(label)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      aria-label={`Filter by ${label}`}
                    />
                    <label
                      htmlFor={`${chartId}-${label}`}
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    [availableLabels, chartId, isOpen, onReset, selectedLabels, toggleLabel]
  );

  return filterControls;
};

// Add prop types validation
ChartFilterControls.propTypes = {
  chartId: PropTypes.string.isRequired,
  availableLabels: PropTypes.arrayOf(PropTypes.string),
  selectedLabels: PropTypes.arrayOf(PropTypes.string),
  onFilterChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

// Main KPI Overview Component
const KpiOverview = () => {
  // State for data
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for filters
  const [globalFilters, setGlobalFilters] = useState({
    valueRange: { min: 0, max: 1000000 },
    selectedLabels: [],
  });

  // Chart-specific filters
  const [chartFilters, setChartFilters] = useState({
    treemap: { selectedLabels: [] },
    pie: { selectedLabels: [] },
    area: { selectedLabels: [], dateRange: { start: null, end: null } },
    line: { selectedLabels: [], dateRange: { start: null, end: null } },
    bar: { selectedLabels: [] },
  });

  // Memoize filtered data calculation
  const applyFilters = useCallback(
    (data, chartId = null) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
      }

      try {
        return data.filter((item) => {
          // Apply global value range filter
          const inValueRange =
            item.size >= globalFilters.valueRange.min &&
            item.size <= globalFilters.valueRange.max;

          if (!inValueRange) return false;

          // Apply global label filter
          const matchesGlobalLabels =
            globalFilters.selectedLabels.length === 0 ||
            globalFilters.selectedLabels.includes(item.name);

          if (!matchesGlobalLabels) return false;

          // Apply chart-specific filters if chartId is provided
          const chartFilter = chartId ? chartFilters[chartId] : null;
          if (chartFilter) {
            // Check chart-specific labels
            if (
              chartFilter.selectedLabels?.length > 0 &&
              !chartFilter.selectedLabels.includes(item.name)
            ) {
              return false;
            }

            // Apply date range filter for time-series charts
            if (chartFilter.dateRange?.start && chartFilter.dateRange?.end) {
              const itemDate = item.date ? new Date(item.date) : new Date();
              const startDate = new Date(chartFilter.dateRange.start);
              const endDate = new Date(chartFilter.dateRange.end);

              if (itemDate < startDate || itemDate > endDate) {
                return false;
              }
            }
          }

          return true;
        });
      } catch (err) {
        console.error("Error applying filters:", err);
        setError("Error applying filters. Please try again.");
        return [];
      }
    },
    [globalFilters, chartFilters]
  );

  // Update filtered data when dependencies change
  useEffect(() => {
    if (originalData.length > 0) {
      setFilteredData(applyFilters(originalData));
    }
  }, [originalData, applyFilters]);

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    setIsLoading(true);
    setError(null);

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = "Calculations";
        const ws = wb.Sheets[wsname];

        if (!ws) {
          throw new Error(
            'Worksheet "Calculations" not found in the Excel file'
          );
        }

        // Read Labels (S4 to W4)
        const newLabels = [];
        const labelCols = ["S", "T", "U", "V", "W"];
        labelCols.forEach((col) => {
          const cell = ws[`${col}4`];
          if (cell && cell.v) {
            newLabels.push(cell.v);
          }
        });

        // Read Monthly Data (R5:W16)
        const monthlyDataArr = [];
        const labelTotals = new Array(newLabels.length).fill(0);

        for (let rowNum = 5; rowNum <= 16; rowNum++) {
          const monthCell = ws[`R${rowNum}`];
          const month = monthCell ? monthCell.v : `Month ${rowNum - 4}`;
          const monthEntry = { name: month };

          newLabels.forEach((label, index) => {
            const col = labelCols[index];
            const valueCell = ws[`${col}${rowNum}`];
            const value =
              valueCell && typeof valueCell.v === "number"
                ? valueCell.v * 100
                : 0;
            monthEntry[label] = parseFloat(value.toFixed(2));
            labelTotals[index] += value;
          });
          monthlyDataArr.push(monthEntry);
        }

        // Process Label-aggregated data
        const labelAggregatedData = newLabels.map((label, index) => ({
          name: label,
          size: parseFloat(labelTotals[index].toFixed(2)),
        }));

        // Update state
        setLabels(newLabels);
        setMonthlyData(monthlyDataArr);
        setOriginalData(labelAggregatedData);
        setFilteredData([...labelAggregatedData]);

        // Set all labels as selected by default
        setGlobalFilters((prev) => ({
          ...prev,
          selectedLabels: labelAggregatedData.map((item) => item.name),
        }));
      } catch (err) {
        console.error("Error processing file:", err);
        setError(
          "Error processing file. Please check the file format and try again."
        );
        toast.error("Error processing file");
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Error reading file. Please try again.");
      setIsLoading(false);
      toast.error("Error reading file");
    };

    reader.readAsBinaryString(file);
  }, []);

  // Handle global filter changes
  const handleGlobalFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setGlobalFilters((prev) => ({
      ...prev,
      valueRange: { ...prev.valueRange, [name]: parseFloat(value) || 0 },
    }));
  }, []);

  // Handle label filter changes
  const handleLabelFilterChange = useCallback((e) => {
    const { name, checked } = e.target;
    setGlobalFilters((prev) => {
      const newLabels = checked
        ? [...prev.selectedLabels, name]
        : prev.selectedLabels.filter((label) => label !== name);
      return { ...prev, selectedLabels: newLabels };
    });
  }, []);

  // Handle chart filter changes
  const handleChartFilterChange = useCallback((chartId, filterType, value) => {
    setChartFilters((prev) => ({
      ...prev,
      [chartId]: { ...prev[chartId], [filterType]: value },
    }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(
    (chartId = null) => {
      if (chartId) {
        setChartFilters((prev) => ({
          ...prev,
          [chartId]: { selectedLabels: [] },
        }));
      } else {
        setGlobalFilters({
          valueRange: { min: 0, max: 1000000 },
          selectedLabels: originalData.map((item) => item.name) || [],
        });

        setChartFilters({
          treemap: { selectedLabels: [] },
          pie: { selectedLabels: [] },
          area: { selectedLabels: [], dateRange: { start: null, end: null } },
          line: { selectedLabels: [], dateRange: { start: null, end: null } },
          bar: { selectedLabels: [] },
        });
      }
    },
    [originalData]
  );

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading data...
          </p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md mx-auto bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-red-500 dark:text-red-400 text-4xl mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title={"KPI"} />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <main className="w-full lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-1 mb-8">
          <div className="w-full justify-center items-center p-4">
            <label
              htmlFor="file"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Upload Excel File:
            </label>
            <div className="flex items-center">
              <input
                id="file"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-blue-900/30 dark:file:text-blue-300
                  dark:hover:file:bg-blue-900/50
                  cursor-pointer"
                disabled={isLoading}
                aria-describedby="file-upload-help"
              />
            </div>
            <p
              className="mt-1 text-sm text-gray-500 dark:text-gray-400"
              id="file-upload-help"
            >
              Upload an Excel file with KPI data (XLSX or XLS format)
            </p>
          </div>

          {/* Global Filters */}
          <div className="filters-container my-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Global Filters
            </h3>

            {/* Value Range Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Value Range:
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label htmlFor="minValue" className="sr-only">
                    Minimum Value
                  </label>
                  <input
                    type="number"
                    id="minValue"
                    name="min"
                    value={globalFilters.valueRange.min}
                    onChange={handleGlobalFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Min"
                    min="0"
                    step="0.01"
                    aria-label="Minimum value"
                  />
                </div>
                <span className="text-gray-500">to</span>
                <div className="flex-1">
                  <label htmlFor="maxValue" className="sr-only">
                    Maximum Value
                  </label>
                  <input
                    type="number"
                    id="maxValue"
                    name="max"
                    value={globalFilters.valueRange.max}
                    onChange={handleGlobalFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Max"
                    min="0"
                    step="0.01"
                    aria-label="Maximum value"
                  />
                </div>
              </div>
            </div>

            {/* Label Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Labels:
              </label>
              <div className="flex flex-wrap gap-3">
                {originalData.map((item) => (
                  <div key={item.name} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`global-${item.name}`}
                      name={item.name}
                      checked={globalFilters.selectedLabels.includes(item.name)}
                      onChange={handleLabelFilterChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                    />
                    <label
                      htmlFor={`global-${item.name}`}
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {item.name}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <button
                  onClick={() => resetFilters()}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Reset all filters
                </button>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              KPI Overview
            </h2>

            {filteredData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Treemap Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Treemap Overview
                    </h3>
                    <ChartFilterControls
                      chartId="treemap"
                      availableLabels={originalData.map((item) => item.name)}
                      selectedLabels={chartFilters.treemap.selectedLabels}
                      onFilterChange={handleChartFilterChange}
                      onReset={resetFilters}
                    />
                  </div>
                  <div className="h-80">
                    <TreemapOverview
                      data={applyFilters(originalData, "treemap")}
                      onItemClick={handleLabelFilterChange}
                    />
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Pie Chart Overview
                    </h3>
                    <ChartFilterControls
                      chartId="pie"
                      availableLabels={originalData.map((item) => item.name)}
                      selectedLabels={chartFilters.pie.selectedLabels}
                      onFilterChange={handleChartFilterChange}
                      onReset={resetFilters}
                    />
                  </div>
                  <div className="h-80">
                    <PieChartOverview
                      data={applyFilters(originalData, "pie")}
                      onItemClick={handleLabelFilterChange}
                    />
                  </div>
                </div>

                {/* Area Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Area Chart Overview
                    </h3>
                    <div className="flex items-center space-x-2">
                      <ChartFilterControls
                        chartId="area"
                        availableLabels={originalData.map((item) => item.name)}
                        selectedLabels={chartFilters.area.selectedLabels}
                        onFilterChange={handleChartFilterChange}
                        onReset={resetFilters}
                      />
                    </div>
                  </div>
                  <div className="h-96">
                    <AreaChartOverview
                      data={monthlyData}
                      labels={chartFilters.area.selectedLabels.length > 0 
                        ? chartFilters.area.selectedLabels 
                        : originalData.map(item => item.name)}
                      onLabelClick={(label) => handleLabelFilterChange({ target: { name: label, checked: true } })}
                    />
                  </div>
                </div>

                {/* Line Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Line Chart Overview
                    </h3>
                    <div className="flex items-center space-x-2">
                      <ChartFilterControls
                        chartId="line"
                        availableLabels={originalData.map((item) => item.name)}
                        selectedLabels={chartFilters.line.selectedLabels}
                        onFilterChange={handleChartFilterChange}
                        onReset={resetFilters}
                      />
                    </div>
                  </div>
                  <div className="h-96">
                    <LineChartOverview
                      data={monthlyData}
                      labels={chartFilters.line.selectedLabels.length > 0 
                        ? chartFilters.line.selectedLabels 
                        : originalData.map(item => item.name)}
                      onLabelClick={(label) => handleLabelFilterChange({ target: { name: label, checked: true } })}
                    />
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Bar Chart Overview
                    </h3>
                    <ChartFilterControls
                      chartId="bar"
                      availableLabels={originalData.map((item) => item.name)}
                      selectedLabels={chartFilters.bar.selectedLabels}
                      onFilterChange={handleChartFilterChange}
                      onReset={resetFilters}
                    />
                  </div>
                  <div className="h-96">
                    <BarChartOverview
                      data={applyFilters(originalData, "bar")}
                      onItemClick={handleLabelFilterChange}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No data to display
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Upload an Excel file to visualize your KPI data.
                </p>
                <div className="mt-6">
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Upload file
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default KpiOverview;
