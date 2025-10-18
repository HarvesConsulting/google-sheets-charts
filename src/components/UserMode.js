import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import './UserMode.css';

const UserMode = ({ data, config, sensors, onBackToStart, onBackToDeveloper }) => {
  const [visibleSensors, setVisibleSensors] = useState({});
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    const initialVisibility = {};
    sensors.forEach(sensor => {
      initialVisibility[sensor.column] = sensor.visible !== false;
    });
    setVisibleSensors(initialVisibility);
  }, [sensors]);

  const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
      const match = /Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/.exec(dateString);
      if (match) {
        const [, year, month, day, hour, minute, second] = match.map(Number);
        return new Date(year, month, day, hour, minute, second).getTime();
      }

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

      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? null : parsed.getTime();
    } catch {
      return null;
    }
  };

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

  // Функція для визначення кольору точки
  const getDotColor = (value) => {
    if (value === null || value === undefined) return '#9CA3AF';
    if (value >= 18) return '#3b82f6';
    if (value > 6 && value < 18) return '#eab308';
    return '#ef4444';
  };

  // Кастомний компонент для точок
  const CustomizedDot = (props) => {
    const { cx, cy, value } = props;

    if (value === null || value === undefined) return null;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={getDotColor(value)}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let processedData = data.map((row) => {
      const rawDate = row[config.xAxis];
      const timestamp = parseDate(rawDate);
      if (!timestamp) return null;

      const dataPoint = {
        name: rawDate,
        timestamp,
        displayTime: formatDateForDisplay(timestamp)
      };

      sensors.forEach(sensor => {
        if (visibleSensors[sensor.column] !== false) {
          const val = row[sensor.column];
          const parsedVal = parseFloat(val);
          dataPoint[sensor.column] = isNaN(parsedVal) ? null : parsedVal;
        }
      });

      return dataPoint;
    }).filter(item => item !== null);

    processedData.sort((a, b) => a.timestamp - b.timestamp);

    if (timeRange !== 'all' && processedData.length > 0) {
      const now = processedData[processedData.length - 1].timestamp;
      const rangeMs = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      }[timeRange];

      if (rangeMs) {
        const cutoff = now - rangeMs;
        processedData = processedData.filter(d => d.timestamp >= cutoff);
      }
    }

    return processedData;
  }, [data, config, sensors, visibleSensors, timeRange]);

  const activeSensors = sensors.filter(sensor => visibleSensors[sensor.column] !== false);
  const lineType = 'monotone';

  // Знаходимо максимальне значення для масштабування осі Y
  const maxValue = useMemo(() => {
    if (!chartData.length) return 20; // значення за замовчуванням
    
    let max = 0;
    chartData.forEach(point => {
      activeSensors.forEach(sensor => {
        const value = point[sensor.column];
        if (value !== null && value !== undefined && value > max) {
          max = value;
        }
      });
    });
    
    // Додаємо трохи місця зверху
    return Math.ceil(max * 1.1);
  }, [chartData, activeSensors]);

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 20, left: 0, bottom: 10 }
    };

    const CustomTooltip = ({ active, payload, label, coordinate }) => {
      if (!active || !payload || !payload.length) return null;

      const tooltipStyle = {
        position: 'absolute',
        left: coordinate?.x,
        top: coordinate?.y - 60,
        transform: 'translateX(-50%)',
        background: '#ffffff',
        color: '#1e293b',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '0.9rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 999
      };

      return (
        <div className="custom-tooltip" style={tooltipStyle}>
          <div style={{ fontWeight: '600', marginBottom: '6px' }}>
            {formatTooltipDate(label)}
          </div>
          {payload.map((entry, i) => (
            <div key={i}>
              <strong style={{ color: entry.color }}>{entry.name}:</strong> {entry.value}
            </div>
          ))}
        </div>
      );
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="timestamp" tickFormatter={formatDateForDisplay} stroke="#9CA3AF" />
            <YAxis 
              stroke="#9CA3AF" 
              width={30}
              domain={[0, maxValue]} // Фіксуємо початок на 0
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {activeSensors.map(sensor => (
              <Area
                key={sensor.column}
                type={lineType}
                dataKey={sensor.column}
                stroke={sensor.color}
                fill={sensor.color}
                fillOpacity={0.3}
                strokeWidth={3}
                dot={<CustomizedDot />}
              />
            ))}
            {/* Додаємо опорні лінії для ключових значень */}
            <ReferenceLine y={6} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={18} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5} />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="timestamp" tickFormatter={formatDateForDisplay} stroke="#9CA3AF" />
            <YAxis 
              stroke="#9CA3AF" 
              width={30}
              domain={[0, maxValue]} // Фіксуємо початок на 0
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {activeSensors.map(sensor => (
              <Bar key={sensor.column} dataKey={sensor.column} fill={sensor.color} name={sensor.name} />
            ))}
            {/* Додаємо опорні лінії для ключових значень */}
            <ReferenceLine y={6} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={18} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5} />
          </BarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="timestamp" tickFormatter={formatDateForDisplay} stroke="#9CA3AF" />
            <YAxis 
              stroke="#9CA3AF" 
              width={30}
              domain={[0, maxValue]} // Фіксуємо початок на 0
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {activeSensors.map(sensor => (
              <Line
                key={sensor.column}
                type={lineType}
                dataKey={sensor.column}
                stroke={sensor.color}
                strokeWidth={3}
                dot={<CustomizedDot />}
                name={sensor.name}
              />
            ))}
            {/* Додаємо опорні лінії для ключових значень */}
            <ReferenceLine y={6} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={18} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={0} stroke="#9CA3AF" opacity={0.5} />
          </LineChart>
        );
    }
  };

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className="user-mode">
        <div className="no-data">
          <h2>📭 Немає даних для побудови графіка</h2>
          <button onClick={onBackToDeveloper} className="btn btn-primary">
            🔧 Повернутись до налаштувань
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-mode">
      <div className="controls-panel">
        <div className="controls-group">
          <label>Тип графіка:</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="line">📈 Лінійний</option>
            <option value="area">🌊 Області</option>
            <option value="bar">📊 Стовпчики</option>
          </select>
        </div>

        <div className="controls-group">
          <label>Період:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="1h">Остання година</option>
            <option value="6h">6 годин</option>
            <option value="24h">24 години</option>
            <option value="7d">7 днів</option>
            <option value="all">Весь час</option>
          </select>
        </div>

        {/* Легенда кольорів */}
        <div className="color-legend">
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#ef4444'}}></div>
            <span>≤ 6</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#eab308'}}></div>
            <span>6 - 18</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#3b82f6'}}></div>
            <span>≥ 18</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={500}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      <div className="actions-panel">
        <button onClick={onBackToStart} className="btn btn-secondary">🏠 На головну</button>
        <button onClick={onBackToDeveloper} className="btn btn-primary">⚙️ Налаштування</button>
      </div>
    </div>
  );
};

export default UserMode;