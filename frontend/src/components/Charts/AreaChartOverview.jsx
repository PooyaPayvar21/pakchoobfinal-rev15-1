import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Dot } from 'recharts';

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

const AreaChartOverview = ({ data, labels, onLabelClick }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={data}
        onClick={(item) => item && onLabelClick(item.activeLabel)}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
        <Tooltip 
          formatter={(value) => `${value.toLocaleString()}`}
          labelFormatter={(label) => `Month: ${label}`}
        />
        <Legend />
                {labels && labels.map((label, index) => (
          <Area
            key={label}
            type="monotone"
            dataKey={label}
            stroke={COLORS[index % COLORS.length]}
            fill={COLORS[index % COLORS.length]}
            name={label}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChartOverview;
