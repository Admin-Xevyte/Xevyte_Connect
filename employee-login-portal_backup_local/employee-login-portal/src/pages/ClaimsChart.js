import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const ClaimsChart = ({ approved, rejected, totalClaims, paidAmount }) => {
  const total = approved + rejected;
  const data = [
    {
      name: 'Approved',
      value: approved,
      percentage: total > 0 ? (approved / total) * 100 : 0,
    },
    {
      name: 'Rejected',
      value: rejected,
      percentage: total > 0 ? (rejected / total) * 100 : 0,
    },
  ];

  const COLORS = ['#f27321', '#1a5989'];

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    index,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    const entry = data[index];
    const textAnchor = x > cx ? 'start' : 'end';
    const labelX = x + (x > cx ? 10 : -10);
    const labelY = y;
    const color = COLORS[index];

    return (
      <text
        x={labelX}
        y={labelY}
        fill={color}
        textAnchor={textAnchor}
        dominantBaseline="central"
        style={{ fontSize: '16px', fontWeight: '500' }}
      >
        {`${entry.name}: ${entry.value}, ${entry.percentage.toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={450}>
      <PieChart>
        {/* Chart Title */}
        <text
          x="50%"
          y="5%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: '20px', fontWeight: '600' }}
        >
          Total Claims Raised: {totalClaims}
        </text>

        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={100}
          outerRadius={130}
          fill="#8884d8"
          paddingAngle={4}
          dataKey="value"
          label={renderCustomizedLabel}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>

     
        <text
          x="50%"
          y="50%" // fixed position below the chart
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: '18px', fill: COLORS[0], fontWeight: '500' }}
        >
          Paid: ₹{Math.floor(paidAmount)}
        </text>

        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ClaimsChart;
