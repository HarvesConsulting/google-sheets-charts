import React from 'react';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './UserMode.css';

const UserMode = ({ data, config, onBackToStart, onBackToDeveloper }) => {
  // Підготовка даних для графіка
  const chartData = data.map(row => ({
    date: row[config.xAxis],
    value: parseFloat(row[config.yAxis]) || 0
  })).filter(item => item.value !== null);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Спроба розпарсити формат "dd.mm.yyyy hh:mm:ss"
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
          <h2>📊 Немає даних для відображення</h2>
          <p>Перейдіть в режим розробника для налаштування даних</p>
          <button onClick={onBackToDeveloper} className="btn btn-primary">
            👨‍💻 Перейти до налаштувань
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-mode">
      <div className="user-header">
        <h2>📊 Графік даних</h2>
        <div className="chart-info">
          <span>📈 {config.yAxis} по {config.xAxis}</span>
          <span>📋 {data.length} точок даних</span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => [value, config.yAxis]}
              labelFormatter={formatDate}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#007bff" 
              strokeWidth={2}
              dot={false}
              name={config.yAxis}
            />
          </LineChart>
        </ResponsiveContainer>
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