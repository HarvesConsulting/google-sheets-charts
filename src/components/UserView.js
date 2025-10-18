import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const UserView = ({ data, config, sensors, loading, error, lastUpdate }) => {
  const [chartType, setChartType] = useState('line');
  const [visibleSensors, setVisibleSensors] = useState({});

  // Ініціалізація видимості датчиків
  useState(() => {
    const initialVisibility = {};
    sensors.forEach(sensor => {
      initialVisibility[sensor.name] = sensor.visible !== false;
    });
    setVisibleSensors(initialVisibility);
  }, [sensors]);

  // Підготовка даних для графіків
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const dates = [...new Set(data.map(row => row[config.dateColumn]))].sort();
    
    return dates.map(date => {
      const dataPoint = { date };
      sensors.forEach(sensor => {
        if (sensor.column && visibleSensors[sensor.name] !== false) {
          const row = data.find(row => row[config.dateColumn] === date);
          dataPoint[sensor.name] = row ? parseFloat(row[sensor.column]) || 0 : null;
        }
      });
      return dataPoint;
    });
  }, [data, config.dateColumn, sensors, visibleSensors]);

  const toggleSensorVisibility = (sensorName) => {
    setVisibleSensors(prev => ({
      ...prev,
      [sensorName]: !prev[sensorName]
    }));
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '---';
    return lastUpdate.toLocaleTimeString('uk-UA');
  };

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="no-data">
          📊 Немає даних для відображення
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    const activeSensors = sensors.filter(sensor => visibleSensors[sensor.name] !== false);

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {activeSensors.map((sensor) => (
              <Line 
                key={sensor.name}
                type="monotone" 
                dataKey={sensor.name} 
                stroke={sensor.color || '#0088FE'}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={sensor.name}
              />
            ))}
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {activeSensors.map((sensor) => (
              <Area 
                key={sensor.name}
                type="monotone" 
                dataKey={sensor.name} 
                stroke={sensor.color || '#0088FE'}
                fill={sensor.color || '#0088FE'}
                fillOpacity={0.3}
                name={sensor.name}
              />
            ))}
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {activeSensors.map((sensor) => (
              <Bar 
                key={sensor.name}
                dataKey={sensor.name} 
                fill={sensor.color || '#0088FE'}
                name={sensor.name}
              />
            ))}
          </BarChart>
        );
      
      default:
        return <div>Оберіть тип графіка</div>;
    }
  };

  if (loading) {
    return <div className="loading">Завантаження...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="user-view">
      <div className="user-header">
        <h2>📈 Моніторинг датчиків</h2>
        <div className="last-update-user">
          ⏰ Дані оновлено: {formatLastUpdate()}
        </div>
      </div>

      <div className="chart-controls-user">
        <div className="chart-type-selector">
          <label>Тип графіка:</label>
          <select 
            value={chartType} 
            onChange={(e) => setChartType(e.target.value)}
          >
            <option value="line">📈 Лінійний</option>
            <option value="area">📊 Області</option>
            <option value="bar">📊 Стовпчиковий</option>
          </select>
        </div>

        <div className="sensors-controls">
          <label>Датчики:</label>
          <div className="sensors-toggle">
            {sensors.map(sensor => (
              <label key={sensor.name} className="sensor-toggle-item">
                <input
                  type="checkbox"
                  checked={visibleSensors[sensor.name] !== false}
                  onChange={() => toggleSensorVisibility(sensor.name)}
                />
                <span 
                  className="sensor-color-indicator"
                  style={{ backgroundColor: sensor.color || '#0088FE' }}
                ></span>
                {sensor.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-wrapper-user">
        <ResponsiveContainer width="100%" height={400}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UserView;