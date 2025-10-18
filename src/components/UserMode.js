import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Brush
} from 'recharts';
import './UserMode.css';

const UserMode = ({ data, config, sensors, onBackToStart, onBackToDeveloper }) => {
  const [visibleSensors, setVisibleSensors] = useState({});
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('all');
  const [showGrid] = useState(true);
  const [smoothLines] = useState(true);

  // --- ініціалізація видимості датчиків ---
  useEffect(() => {
    const initialVisibility = {};
    sensors.forEach(sensor => {
      initialVisibility[sensor.column] = sensor.visible !== false;
    });
    setVisibleSensors(initialVisibility);
  }, [sensors]);

  // --- універсальний парсер дати ---
  const parseDate = (dateString) => {
    if (!dateString) return null;

    try {
      // Формат Google Sheets: Date(2025,8,2,16,34,37)
      const match = /Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/.exec(dateString);
      if (match) {
        const [, year, month, day, hour, minute, second] = match.map(Number);
        return new Date(year, month, day, hour, minute, second).getTime();
      }

      // Формат dd.mm.yyyy hh:mm:ss
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

      // fallback стандартного парсингу
      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? null : parsed.getTime();
    } catch (err) {
      console.warn('Помилка парсингу дати:', dateString, err);
      return null;
    }
  };

  // --- форматування дати для осі ---
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

  // --- формування даних для графіка ---
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      console.warn('❌ Немає даних для побудови графіка');
      return [];
    }

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

    console.log('✅ chartData готовий:', processedData.slice(0, 3));
    return processedData;
  }, [data, config, sensors, visibleSensors, timeRange]);

  const activeSensors = sensors.filter(sensor => visibleSensors[sensor.column] !== false);

    // --- обробка відсутності даних ---
  if (!data || data.length === 0) {
    return (
      <div className="user-mode">
        <div className="no-data">
          <div className="no-data-icon">📊</div>
          <h2>Немає даних для відображення</h2>
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
          <p>Перевірте:
            <ul style={{ textAlign: 'left', display: 'inline-block', color: '#cbd5e1' }}>
              <li>Чи правильно обрана вісь X (колонка з датами)</li>
              <li>Чи додані датчики для осі Y</li>
              <li>Чи формат дат відповідає "dd.mm.yyyy hh:mm:ss" або "Date(...)"</li>
            </ul>
          </p>
          <button onClick={onBackToDeveloper} className="btn btn-primary">⚙️ Налаштування</button>
        </div>
      </div>
    );
  }

  // --- вибір типу графіка ---
  const lineType = smoothLines ? 'monotone' : 'linear';

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    const commonTooltip = {
      formatter: (value, name) => {
        const sensor = sensors.find(s => s.column === name);
        return [value, sensor ? sensor.name : name];
      },
      labelFormatter: formatTooltipDate,
      contentStyle: {
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid #374151',
        borderRadius: '8px',
        color: 'white'
      }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="timestamp" tickFormatter={formatDateForDisplay} stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip {...commonTooltip} />
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
                name={sensor.name}
                dot={false}
              />
            ))}
            <Brush dataKey="timestamp" height={30} stroke="#374151" tickFormatter={formatDateForDisplay} />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="timestamp" tickFormatter={formatDateForDisplay} stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip {...commonTooltip} />
            <Legend />
            {activeSensors.map(sensor => (
              <Bar key={sensor.column} dataKey={sensor.column} fill={sensor.color} name={sensor.name} />
            ))}
          </BarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={showGrid ? 0.3 : 0} />
            <XAxis dataKey="timestamp" tickFormatter={formatDateForDisplay} stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip {...commonTooltip} />
            <Legend />
            {activeSensors.map(sensor => (
              <Line
                key={sensor.column}
                type={lineType}
                dataKey={sensor.column}
                stroke={sensor.color}
                strokeWidth={3}
                dot={false}
                name={sensor.name}
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
            <option value="1h">1 година</option>
            <option value="6h">6 годин</option>
            <option value="24h">24 години</option>
            <option value="7d">7 днів</option>
            <option value="all">Весь період</option>
          </select>
        </div>
      </div>

      <div className="chart-section">
        <ResponsiveContainer width="100%" height={500}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UserMode;
