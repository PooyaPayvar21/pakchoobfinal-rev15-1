import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

const PieChartOverview = ({ data = [], onLabelClick = () => {} }) => {
  // Validate data
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400 text-center p-4">
          No data available for the pie chart.
        </div>
      </div>
    );
  }

  // Filter out invalid data points
  const validData = data.filter(
    item => item && typeof item.size === 'number' && item.name
  );

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400 text-center p-4">
          No valid data to display in the pie chart.
        </div>
      </div>
    );
  }
  
  // Calculate total for percentage calculations
  const total = validData.reduce((sum, item) => sum + (item.size || 0), 0);
  
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={validData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius="80%"
            fill="#8884d8"
            dataKey="size"
            nameKey="name"
            onClick={(data) => data?.name && onLabelClick(data.name)}
            label={({ name, size }) => {
              const percentage = total > 0 ? (size / total) * 100 : 0;
              return `${name}: ${percentage.toFixed(1)}%`;
            }}
          >
            {validData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                stroke="#fff"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : 'N/A')}
            labelFormatter={(label) => label || 'N/A'}
          />
          <Legend 
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '10px' }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(PieChartOverview);
