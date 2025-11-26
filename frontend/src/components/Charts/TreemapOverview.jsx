/* eslint-disable no-unused-vars */
import React from "react";
import { Treemap, ResponsiveContainer, Tooltip, Cell } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

const TreemapOverview = ({ data = [], onLabelClick = () => {} }) => {
  // Validate data
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400 text-center p-4">
          No data available for the treemap.
        </div>
      </div>
    );
  }

  // Filter out items with invalid sizes
  const validData = data.filter(item => item && typeof item.size === 'number');
  
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400 text-center p-4">
          No valid data to display in the treemap.
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={validData}
          dataKey="size"
          ratio={4 / 3}
          stroke="#fff"
          fill="#8884d8"
          onClick={(data) => data?.name && onLabelClick(data.name)}
        >
          <Tooltip 
            formatter={(value) => typeof value === 'number' ? value.toLocaleString() : 'N/A'}
            labelFormatter={(label) => `Label: ${label || 'N/A'}`}
          />
          {validData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(TreemapOverview);
