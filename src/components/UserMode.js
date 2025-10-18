import React, { useState, useMemo } from 'react';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './UserMode.css';

const UserMode = ({ data, config, sensors, onBackToStart, onBackToDeveloper }) => {
  const [visibleSensors, setVisibleSensors] = useState({});

  // Ініціалізація видимості датчиків
  useState(() => {
    const initialVisibility = {};
    sensors.forEach(sensor => {
      initialVisibility[sensor.column] = sensor.visible !== false;
    });
    setVisibleSensors(initialVisibility);
  }, [sensors]);

  // Підготовка даних для графіка
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(row => {
      const dataPoint = {
        name: row[config.xAxis]
      };
      
      sensors.forEach(sensor => {
        if (visibleSensors[sensor.column] !== false) {
          dataPoint[sensor.column] = row[sensor.column] ? parseFloat(row[sensor.column]) || 0 : null;
        }
      });
      
      return dataPoint;
    }).filter(item => item.name); // Фільтруємо рядки без значень осі X
  }, [data, config.xAxis, sensors, visibleSensors]);

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

  const toggleSensorVisibility = (sensorColumn) => {
    setVisibleSensors(prev => ({
      ...prev,
      [sensorColumn]: !prev[sensorColumn]
    }));
  };

  const activeSensors = sensors.filter(sensor => visibleSensors[sensor.column] !== false);

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
          <span>📈 {activeSensors.length} з {sensors.length} датчиків активні</span>
          <span>📋 {chartData.length} точок даних</span>
          <span>🕒 Останнє оновлення: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Контроль видимості датчиків */}
      <div className="sensors-controls">
        <h4>🎛️ Керування датчиками:</h4>
        <div className="sensors-toggle">
          {sensors.map(sensor => (
            <label key={sensor.column} className="sensor-toggle-item">
              <input
                type="checkbox"
                checked={visibleSensors[sensor.column] !== false}
                onChange={() => toggleSensorVisibility(sensor.column)}
              />
              <span 
                className="sensor-color-indicator"
                style={{ backgroundColor: sensor.color }}
              ></span>
              {sensor.name}
            </label>
          ))}
        </div>
      </div>

      {/* Графік */}
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
              label={{ value: config.yAxisLabel || 'Значення', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value, name) => {
                const sensor = sensors.find(s => s.column === name);
                return [value, sensor ? sensor.name : name];
              }}
              labelFormatter={formatDate}
            />
            <Legend />
            {activeSensors.map((sensor) => (
              <Line 
                key={sensor.column}
                type="monotone" 
                dataKey={sensor.column} 
                stroke={sensor.color} 
                strokeWidth={3}
                dot={{ fill: sensor.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: sensor.color, strokeWidth: 2 }}
                name={sensor.name}
                isAnimationActive={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Статистика */}
      <div className="data-summary">
        <div className="summary-card">
          <h4>📈 Статистика даних</h4>
          <div className="stats-grid">
            {activeSensors.map(sensor => {
              const sensorData = chartData.map(d => d[sensor.column]).filter(val => val !== null);
              const min = Math.min(...sensorData);
              const max = Math.max(...sensorData);
              const avg = sensorData.reduce((a, b) => a + b, 0) / sensorData.length;
              
              return (
                <div key={sensor.column} className="sensor-stats">
                  <h5 style={{ color: sensor.color }}>{sensor.name}</h5>
                  <div className="stat">
                    <span className="stat-label">Мін:</span>
                    <span className="stat-value">{min.toFixed(2)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Макс:</span>
                    <span className="stat-value">{max.toFixed(2)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Сер:</span>
                    <span className="stat-value">{avg.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
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