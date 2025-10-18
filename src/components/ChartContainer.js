import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import { cleanChartData } from '../services/googleSheetsAPI';

const ChartContainer = ({ data, config }) => {
  const [chartType, setChartType] = useState('line');

  // Кольори для графіків
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Очищаємо дані для графіків
  const cleanedData = useMemo(() => {
    return cleanChartData(data, config.xAxis, config.yAxis);
  }, [data, config.xAxis, config.yAxis]);

  const renderChart = () => {
    if (!cleanedData || cleanedData.length === 0) {
      return (
        <div className="no-data">
          📊 Немає даних для відображення. 
          <br />
          <small>
            Перевірте: 
            <br />- Чи є числові дані в колонці "{config.yAxis}"
            <br />- Чи немає порожніх комірок
            <br />- Чи правильно вказані назви колонок
          </small>
        </div>
      );
    }

    const commonProps = {
      data: cleanedData,
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
              data={cleanedData}
              dataKey={config.yAxis}
              nameKey={config.xAxis}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {cleanedData.map((entry, index) => (
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
        
        <div className="data-stats">
          📈 Дані: {cleanedData.length} з {data.length} рядків (відфільтровано)
        </div>
      </div>
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={400}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      <div className="data-preview">
        <h4>👀 Попередній перегляд даних (перші 5 рядків):</h4>
        <pre>{JSON.stringify(data.slice(0, 5), null, 2)}</pre>
        <p>Всього рядків: {data.length} | Відфільтровано: {cleanedData.length}</p>
      </div>
    </div>
  );
};

export default ChartContainer;