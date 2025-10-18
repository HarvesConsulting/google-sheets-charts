import React from 'react';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './UserMode.css';

const UserMode = ({ data, config, onBackToStart, onBackToDeveloper }) => {
  // Підготовка даних для графіка
  const chartData = data.map(row => ({
    name: row[config.xAxis],
    value: parseFloat(row[config.yAxis]) || 0
  })).filter(item => item.value !== null && item.name);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const parts = dateString.toString().split(' ');
      if (parts.length >= 2) {
        const dateParts = parts[0].split('.');
        const timeParts = parts[1].split(':');
        
        if (dateParts.length === 3 && timeParts.length >= 2) {
          const day = dateParts[0];
          const month = dateParts[1];
          const hours = timeParts[0];
          const minutes = timeParts[1];
          
          return `${day}.${month} ${hours}:${minutes}`;
        }
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  if (data.length === 0) {
    return (
      <div className="user-mode">
        <div className="no-data">
          <div className="no-data-icon">📊</div>
          <h2>Немає даних для відображення</h2>
          <p>Перейдіть в режим налаштувань для завантаження даних</p>
          <button onClick={onBackToDeveloper} className="btn btn-primary">
            ⚙️ Перейти до налаштувань
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-mode">
      <div className="user-header">
        <h2>{config.chartTitle || 'Графік даних'}</h2>
        <div className="chart-info">
          <span>📈 {config.yAxis} по {config.xAxis}</span>
          <span>📋 {chartData.length} точок даних</span>
          <span>🕒 Останнє оновлення: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              label={{ value: config.xAxis, position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: config.yAxisLabel || config.yAxis, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value) => [value, config.yAxis]}
              labelFormatter={formatDate}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#007bff" 
              strokeWidth={3}
              dot={{ fill: '#007bff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#007bff', strokeWidth: 2 }}
              name={config.yAxis}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="data-summary">
        <div className="summary-card">
          <h4>📈 Статистика даних</h4>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-label">Мінімальне значення:</span>
              <span className="stat-value">
                {Math.min(...chartData.map(d => d.value)).toFixed(2)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Максимальне значення:</span>
              <span className="stat-value">
                {Math.max(...chartData.map(d => d.value)).toFixed(2)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Середнє значення:</span>
              <span className="stat-value">
                {(chartData.reduce((a, b) => a + b.value, 0) / chartData.length).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="user-actions">
        <button onClick={onBackToStart} className="btn btn-secondary">
          🏠 На головну
        </button>
        <button onClick={onBackToDeveloper} className="btn btn-primary">
          ⚙️ Змінити налаштування
        </button>
      </div>
    </div>
  );
};

export default UserMode;