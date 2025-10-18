import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Brush, Bar as RechartsBar
} from 'recharts';
import './UserMode.css';

const UserMode = ({ data, config, sensors, onBackToStart, onBackToDeveloper }) => {
  const [visibleSensors, setVisibleSensors] = useState({});
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('all');
  const [showGrid, setShowGrid] = useState(true);
  const [smoothLines, setSmoothLines] = useState(true);

  // Ініціалізація видимості датчиків
  React.useEffect(() => {
    const initialVisibility = {};
    sensors.forEach(sensor => {
      initialVisibility[sensor.column] = sensor.visible !== false;
    });
    setVisibleSensors(initialVisibility);
  }, [sensors]);

  // Підготовка даних для графіка
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let processedData = data.map(row => {
      const dataPoint = {
        name: row[config.xAxis],
        timestamp: new Date(row[config.xAxis].replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$2-$1')).getTime()
      };
      
      sensors.forEach(sensor => {
        if (visibleSensors[sensor.column] !== false) {
          dataPoint[sensor.column] = row[sensor.column] ? parseFloat(row[sensor.column]) || 0 : null;
        }
      });
      
      return dataPoint;
    }).filter(item => item.name && !isNaN(item.timestamp));

    // Сортування за часом
    processedData.sort((a, b) => a.timestamp - b.timestamp);

    // Фільтрація за часовим діапазоном
    if (timeRange !== 'all' && processedData.length > 0) {
      const now = processedData[processedData.length - 1].timestamp;
      const rangeMs = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      }[timeRange];
      
      if (rangeMs) {
        const cutoffTime = now - rangeMs;
        processedData = processedData.filter(item => item.timestamp >= cutoffTime);
      }
    }

    return processedData;
  }, [data, config.xAxis, sensors, visibleSensors, timeRange]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTooltipDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const toggleSensorVisibility = (sensorColumn) => {
    setVisibleSensors(prev => ({
      ...prev,
      [sensorColumn]: !prev[sensorColumn]
    }));
  };

  const activeSensors = sensors.filter(sensor => visibleSensors[sensor.column] !== false);

  // Розрахунок статистики
  const statistics = useMemo(() => {
    return activeSensors.map(sensor => {
      const sensorData = chartData.map(d => d[sensor.column]).filter(val => val !== null);
      const min = sensorData.length > 0 ? Math.min(...sensorData) : 0;
      const max = sensorData.length > 0 ? Math.max(...sensorData) : 0;
      const avg = sensorData.length > 0 ? sensorData.reduce((a, b) => a + b, 0) / sensorData.length : 0;
      const current = sensorData.length > 0 ? sensorData[sensorData.length - 1] : 0;
      
      return {
        sensor,
        min,
        max,
        avg,
        current,
        dataPoints: sensorData.length
      };
    });
  }, [activeSensors, chartData]);

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

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    const lineType = smoothLines ? 'monotone' : 'linear';

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              stroke="#9CA3AF"
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              formatter={(value, name) => {
                const sensor = sensors.find(s => s.column === name);
                return [value, sensor ? sensor.name : name];
              }}
              labelFormatter={formatTooltipDate}
              contentStyle={{
                background: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            <Legend />
            {activeSensors.map((sensor) => (
              <Area 
                key={sensor.column}
                type={lineType}
                dataKey={sensor.column}
                stroke={sensor.color}
                fill={sensor.color}
                fillOpacity={0.3}
                strokeWidth={3}
                name={sensor.name}
                dot={false}
                activeDot={{ r: 6, stroke: sensor.color, strokeWidth: 2 }}
              />
            ))}
            <Brush dataKey="timestamp" height={30} stroke="#374151" tickFormatter={formatDate} />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              stroke="#9CA3AF"
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              formatter={(value, name) => {
                const sensor = sensors.find(s => s.column === name);
                return [value, sensor ? sensor.name : name];
              }}
              labelFormatter={formatTooltipDate}
              contentStyle={{
                background: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            <Legend />
            {activeSensors.map((sensor) => (
              <Bar 
                key={sensor.column}
                dataKey={sensor.column}
                fill={sensor.color}
                name={sensor.name}
                opacity={0.8}
              />
            ))}
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              stroke="#9CA3AF"
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              formatter={(value, name) => {
                const sensor = sensors.find(s => s.column === name);
                return [value, sensor ? sensor.name : name];
              }}
              labelFormatter={formatTooltipDate}
              contentStyle={{
                background: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            <Legend />
            {activeSensors.map((sensor, index) => (
              index === 0 ? (
                <Area 
                  key={sensor.column}
                  type={lineType}
                  dataKey={sensor.column}
                  fill={sensor.color}
                  fillOpacity={0.3}
                  stroke={sensor.color}
                  strokeWidth={3}
                  name={sensor.name}
                />
              ) : (
                <Line 
                  key={sensor.column}
                  type={lineType}
                  dataKey={sensor.column}
                  stroke={sensor.color}
                  strokeWidth={3}
                  dot={false}
                  name={sensor.name}
                />
              )
            ))}
          </ComposedChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={showGrid ? 0.3 : 0} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              stroke="#9CA3AF"
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              formatter={(value, name) => {
                const sensor = sensors.find(s => s.column === name);
                return [value, sensor ? sensor.name : name];
              }}
              labelFormatter={formatTooltipDate}
              contentStyle={{
                background: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            <Legend />
            {activeSensors.map((sensor) => (
              <Line 
                key={sensor.column}
                type={lineType}
                dataKey={sensor.column}
                stroke={sensor.color}
                strokeWidth={3}
                dot={false}
                name={sensor.name}
                activeDot={{ 
                  r: 6, 
                  stroke: sensor.color, 
                  strokeWidth: 2,
                  fill: '#1F2937'
                }}
              />
            ))}
            <Brush dataKey="timestamp" height={30} stroke="#374151" tickFormatter={formatDate} />
            <ReferenceLine y={0} stroke="#9CA3AF" opacity={0.5} />
          </LineChart>
        );
    }
  };

  return (
    <div className="user-mode">
      {/* Header */}
      <div className="user-header">
        <div className="header-content">
          <h1>{config.chartTitle || 'Графік даних'}</h1>
          <div className="header-stats">
            <div className="stat-badge">
              <span className="stat-icon">📈</span>
              <span>{activeSensors.length} активних датчиків</span>
            </div>
            <div className="stat-badge">
              <span className="stat-icon">📊</span>
              <span>{chartData.length} точок</span>
            </div>
            <div className="stat-badge">
              <span className="stat-icon">🕒</span>
              <span>{new Date().toLocaleTimeString('uk-UA')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="controls-panel">
        <div className="controls-group">
          <label>Тип графіка:</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="line">📈 Лінійний</option>
            <option value="area">🌊 Області</option>
            <option value="bar">📊 Стовпчики</option>
            <option value="composed">🔀 Комбінований</option>
          </select>
        </div>

        <div className="controls-group">
          <label>Період:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="1h">Остання година</option>
            <option value="6h">Останні 6 годин</option>
            <option value="24h">Останні 24 години</option>
            <option value="7d">Останні 7 днів</option>
            <option value="all">Весь період</option>
          </select>
        </div>

        <div className="controls-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Показувати сітку
          </label>
        </div>

        <div className="controls-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={smoothLines}
              onChange={(e) => setSmoothLines(e.target.checked)}
            />
            Згладжування ліній
          </label>
        </div>
      </div>

      {/* Sensors Control */}
      <div className="sensors-panel">
        <h3>🎛️ Керування датчиками</h3>
        <div className="sensors-grid">
          {sensors.map(sensor => (
            <div key={sensor.column} className="sensor-control-card">
              <label className="sensor-toggle">
                <input
                  type="checkbox"
                  checked={visibleSensors[sensor.column] !== false}
                  onChange={() => toggleSensorVisibility(sensor.column)}
                />
                <span 
                  className="sensor-color"
                  style={{ backgroundColor: sensor.color }}
                ></span>
                <span className="sensor-name">{sensor.name}</span>
              </label>
              {visibleSensors[sensor.column] && (
                <div className="sensor-preview" style={{ borderLeftColor: sensor.color }}>
                  <span className="sensor-value">
                    {statistics.find(s => s.sensor.column === sensor.column)?.current.toFixed(2) || '0'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="chart-section">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={500}>
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistics */}
      {statistics.length > 0 && (
        <div className="statistics-panel">
          <h3>📈 Статистика</h3>
          <div className="stats-grid">
            {statistics.map((stat, index) => (
              <div key={stat.sensor.column} className="stat-card" style={{ borderLeftColor: stat.sensor.color }}>
                <div className="stat-header">
                  <h4 style={{ color: stat.sensor.color }}>{stat.sensor.name}</h4>
                  <span className="data-points">{stat.dataPoints} точок</span>
                </div>
                <div className="stat-values">
                  <div className="stat-item">
                    <span className="stat-label">Поточне:</span>
                    <span className="stat-value current">{stat.current.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Мін:</span>
                    <span className="stat-value min">{stat.min.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Макс:</span>
                    <span className="stat-value max">{stat.max.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Середнє:</span>
                    <span className="stat-value avg">{stat.avg.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="actions-panel">
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