import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';

const ChartContainer = ({ data, config }) => {
  const [chartType, setChartType] = useState('line');

  // Кольори для графіків
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderChart = () => {
    if (!data || data.length === 0) {
      return <div className="no-data">📊 Немає даних для відображення</div>;
    }

    const commonProps = {
      data: data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={config.yAxis} 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={config.yAxis} fill="#8884d8" />
          </BarChart>
        );
      
      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              dataKey={config.yAxis}
              nameKey={config.xAxis}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      
      default:
        return <div>Оберіть тип графіка</div>;
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-controls">
        <h3>📊 Тип графіка:</h3>
        <select 
          value={chartType} 
          onChange={(e) => setChartType(e.target.value)}
          className="chart-select"
        >
          <option value="line">📈 Лінійний</option>
          <option value="bar">📊 Стовпчиковий</option>
          <option value="pie">🥧 Кругова діаграма</option>
        </select>
      </div>
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={400}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      <div className="data-preview">
        <h4>👀 Попередній перегляд даних (перші 5 рядків):</h4>
        <pre>{JSON.stringify(data.slice(0, 5), null, 2)}</pre>
        <p>Всього рядків: {data.length}</p>
      </div>
    </div>
  );
};

export default ChartContainer;