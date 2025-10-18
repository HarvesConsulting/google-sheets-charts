import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Brush
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

  // Функція для конвертації дати з рядка в timestamp
  const parseDate = (dateString) => {
  if (!dateString) return null;

  try {
    // Обробка специфічного формату: Date(2025,8,2,16,34,37)
    const dateMatch = /Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/.exec(dateString);
    if (dateMatch) {
      const [, year, month, day, hour, minute, second] = dateMatch.map(Number);
      return new Date(year, month, day, hour, minute, second).getTime();
    }

    // Спроба розпарсити "dd.mm.yyyy hh:mm:ss"
    const parts = dateString.toString().split(' ');
    if (parts.length >= 2) {
      const dateParts = parts[0].split('.');
      const timeParts = parts[1].split(':');

      if (dateParts.length === 3 && timeParts.length >= 2) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

        return new Date(year, month, day, hours, minutes, seconds).getTime();
      }
    }

    // Фолбек на стандартний new Date()
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed.getTime();
  } catch {
    return null;
  }
};

  // Підготовка даних для графіка - ВИПРАВЛЕНА ВЕРСІЯ
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      console.log('❌ Немає даних для обробки');
      return [];
    }
    
    console.log('📊 Оригінальні дані:', data.slice(0, 3));
    console.log('🎯 Конфігурація:', config);
    console.log('🔧 Датчики:', sensors);

    let processedData = data.map((row, index) => {
      const timestamp = parseDate(row[config.xAxis]);
      
      if (!timestamp) {
        console.log(`⚠️ Не вдалося розпарсити дату: ${row[config.xAxis]}`);
        return null;
      }

      const dataPoint = {
        name: row[config.xAxis],
        timestamp: timestamp,
        displayTime: formatDateForDisplay(timestamp)
      };
      
      sensors.forEach(sensor => {
        if (visibleSensors[sensor.column] !== false) {
          const value = row[sensor.column];
          dataPoint[sensor.column] = value !== undefined && value !== null && value !== '' 
            ? parseFloat(value) 
            : null;
        }
      });
      
      return dataPoint;
    }).filter(item => item !== null && item.name);

    console.log('📈 Оброблені дані:', processedData.slice(0, 3));

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

    console.log('✅ Фінальні дані для графіка:', processedData.length, 'точок');
    return processedData;
  }, [data, config, sensors, visibleSensors, timeRange]);

  const formatDateForDisplay = (timestamp) => {
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

  // Додамо перевірку на наявність даних
  if (!data || data.length === 0) {
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

  if (chartData.length === 0) {
    return (
      <div className="user-mode">
        <div className="no-data">
          <div className="no-data-icon">⚠️</div>
          <h2>Не вдалося підготувати дані для графіка</h2>
          <p>Перевірте:</p>
          <ul style={{ textAlign: 'left', display: 'inline-block', color: '#cbd5e1' }}>
            <li>Чи правильно обрана вісь X (колонка з датами)</li>
            <li>Чи додані датчики для осі Y</li>
            <li>Чи формат дат відповідає "dd.mm.yyyy hh:mm:ss"</li>
          </ul>
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
              tickFormatter={formatDateForDisplay}
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
            <Brush dataKey="timestamp" height={30} stroke="#374151" tickFormatter={formatDateForDisplay} />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatDateForDisplay}
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
              tickFormatter={formatDateForDisplay}
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
              tickFormatter={formatDateForDisplay}
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
            <Brush dataKey="timestamp" height={30} stroke="#374151" tickFormatter={formatDateForDisplay} />
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