import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

const BarChartOverview = ({ data = [], onLabelClick = () => {} }) => {
  // Validate data
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400 text-center p-4">
          No data available for the bar chart.
        </div>
      </div>
    );
  }

  // Filter out invalid data points
  const validData = data.filter(
    (item) => item && typeof item.size === "number" && item.name
  );

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400 text-center p-4">
          No valid data to display in the bar chart.
        </div>
      </div>
    );
  }

  // Find the maximum value for Y-axis scaling
  const maxValue = Math.max(...validData.map((item) => item.size || 0));
  const yAxisDomain = [0, maxValue * 1.1]; // Add 10% padding

  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={validData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barSize={30}
          onClick={(item) => {
            if (item?.activeLabel) {
              onLabelClick(item.activeLabel);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value;
            }}
            domain={yAxisDomain}
            width={60}
          />
          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? value.toLocaleString() : "N/A"
            }
            labelFormatter={(label) => label || "N/A"}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              padding: "0.5rem",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "10px",
              paddingBottom: "10px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
            content={({ payload }) => {
              return (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  {validData.map((entry, index) => {
                    const displayValue = entry?.size;
                    let formattedValue = displayValue;

                    if (typeof displayValue === "number") {
                      if (displayValue >= 1000000) {
                        formattedValue = `${(displayValue / 1000000).toFixed(
                          1
                        )}M`;
                      } else if (displayValue >= 1000) {
                        formattedValue = `${(displayValue / 1000).toFixed(0)}K`;
                      }
                    }

                    return (
                      <div
                        key={`legend-item-${index}`}
                        onClick={() => onLabelClick(entry.name)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          transition: "all 0.2s",
                          ":hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.05)",
                            transform: "scale(1.05)",
                          },
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: COLORS[index % COLORS.length],
                            marginRight: "8px",
                            borderRadius: "2px",
                          }}
                        />
                        <span
                          style={{
                            color: COLORS[index % COLORS.length],
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {entry.name || "N/A"}: {formattedValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          <Bar
            dataKey="size"
            name={"Size"}
            radius={[4, 4, 0, 0]}
            label={{
              position: "top",
              formatter: (value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value;
              },
              style: { fontSize: "12px", fill: "#00C49F" },
            }}
            legendType="rect"
          >
            {validData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="#fff"
                strokeWidth={1}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(BarChartOverview);
