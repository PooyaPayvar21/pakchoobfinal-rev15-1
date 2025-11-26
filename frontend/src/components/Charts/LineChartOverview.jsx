import React, { useMemo } from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

const LineChartOverview = ({ data = [], labels = [], onLabelClick = () => {} }) => {
  // Validate data and labels
  const hasValidData = useMemo(() => {
    return Array.isArray(data) && data.length > 0 && 
           Array.isArray(labels) && labels.length > 0;
  }, [data, labels]);

  // Process data to ensure all required fields are present
  const processedData = useMemo(() => {
    if (!hasValidData) return [];
    
    return data.map(item => ({
      ...item,
      // Ensure all label keys exist in each data point
      ...labels.reduce((acc, label) => {
        if (item[label] === undefined) acc[label] = 0;
        return acc;
      }, {})
    }));
  }, [data, labels, hasValidData]);

  // Calculate Y-axis domain with padding
  const yAxisDomain = useMemo(() => {
    if (!hasValidData) return [0, 100];
    
    let maxValue = 0;
    data.forEach(item => {
      labels.forEach(label => {
        const value = Number(item[label]) || 0;
        maxValue = Math.max(maxValue, value);
      });
    });
    
    return [0, Math.ceil(maxValue * 1.1)]; // 10% padding
  }, [data, labels, hasValidData]);

  if (!hasValidData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400 text-center p-4">
          {!Array.isArray(labels) || labels.length === 0 
            ? "No data series configured for the line chart." 
            : "No data available for the line chart."}
        </div>
      </div>
    );
  }

  const formatYAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value;
  };

  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={processedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          onClick={(item) => {
            if (item?.activeLabel) {
              onLabelClick(item.activeLabel);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            domain={yAxisDomain}
            width={60}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : 'N/A')}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: '10px',
              paddingBottom: '10px'
            }}
          />
          {labels.map((label, index) => (
            <Line
              key={label}
              type="monotone"
              dataKey={label}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{
                r: 4,
                stroke: COLORS[index % COLORS.length],
                fill: '#fff',
                strokeWidth: 2
              }}
              activeDot={{
                r: 6,
                stroke: COLORS[index % COLORS.length],
                fill: '#fff',
                strokeWidth: 2
              }}
              name={label}
            />
          ))}
          <ReferenceLine y={0} stroke="#e2e8f0" />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(LineChartOverview);
