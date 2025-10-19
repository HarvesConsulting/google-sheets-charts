import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea
} from 'recharts';
import './UserMode.css';

const UserMode = ({ data, config, sensors, onBackToStart, onBackToDeveloper }) => {
  const [visibleSensors, setVisibleSensors] = useState({});
  const [timeRange, setTimeRange] = useState('7d');
  const [showControls, setShowControls] = useState(false);
  const [showBottomPanel, setShowBottomPanel] = useState(false);

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
        '1d': 24 * 60 * 60 * 1000,
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

  const getYAxisRange = () => {
    if (chartData.length === 0) return { yMin: 0, yMax: 24 };
    
    let yMin = 0;
    let yMax = 24;
    
    const allValues = chartData.flatMap(point => 
      activeSensors.map(sensor => point[sensor.column]).filter(val => val !== null)
    );
    
    if (allValues.length > 0) {
      yMin = Math.min(...allValues);
      yMax = Math.max(...allValues);
      
      const padding = (yMax - yMin) * 0.1;
      yMin = Math.min(yMin - padding, 0);
      yMax += padding;
    }
    
    return { yMin, yMax };
  };

  const { yMin, yMax } = getYAxisRange();

  const CustomTooltip = ({ active, payload, label, coordinate }) => {
    if (!active || !payload || !payload.length) return null;

    const tooltipStyle = {
      position: 'absolute',
      left: coordinate?.x,
      top: coordinate?.y - 60,
      transform: 'translateX(-50%)',
      background: '#ffffff',
      color: '#000000',
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
        <div style={{ fontWeight: '600', marginBottom: '6px', color: '#000000' }}>
          {formatTooltipDate(label)}
        </div>
        {payload.map((entry, i) => (
          <div key={i} style={{ color: '#000000' }}>
            <strong style={{ color: entry.color || '#1e3a8a' }}>{entry.name}:</strong> {entry.value}
          </div>
        ))}
      </div>
    );
  };

  const renderZones = () => (
    <>
      <ReferenceArea 
        y1={0} 
        y2={6} 
        fill="#ff4444" 
        fillOpacity={0.2}
        stroke="none"
      />
      <ReferenceArea 
        y1={6} 
        y2={18} 
        fill="#ffcc00" 
        fillOpacity={0.2}
        stroke="none"
      />
      <ReferenceArea 
        y1={18} 
        y2={yMax} 
        fill="#44ff44" 
        fillOpacity={0.2}
        stroke="none"
      />
      <ReferenceLine y={6} stroke="#ff4444" strokeWidth={2} strokeDasharray="5 5" opacity={0.7} />
      <ReferenceLine y={18} stroke="#44ff44" strokeWidth={2} strokeDasharray="5 5" opacity={0.7} />
    </>
  );

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className="user-mode">
        <div className="no-data">
          <div className="no-data-icon">📭</div>
          <h2>Немає даних для побудови графіка</h2>
          <p>Перевірте налаштування даних або спробуйте інший період</p>
          <button onClick={onBackToDeveloper} className="btn btn-primary">
            🔧 Повернутись до налаштувань
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-mode">
      {/* Верхня сендвіч кнопка */}
      <div className="hamburger-toggle top-hamburger" onClick={() => setShowControls(!showControls)}>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </div>

      {/* Панель керування зверху */}
      <div className={`controls-panel ${showControls ? 'open' : ''}`}>
        <div className="controls-group">
          <label>Період даних:</label>
          <div className="time-buttons">
            <button 
              className={`time-btn ${timeRange === 'all' ? 'active' : ''}`}
              onClick={() => setTimeRange('all')}
            >
              Весь період
            </button>
            <button 
              className={`time-btn ${timeRange === '7d' ? 'active' : ''}`}
              onClick={() => setTimeRange('7d')}
            >
              7 днів
            </button>
            <button 
              className={`time-btn ${timeRange === '1d' ? 'active' : ''}`}
              onClick={() => setTimeRange('1d')}
            >
              Добу
            </button>
          </div>
        </div>

        <div className="controls-group">
          <label>Вибір датчиків:</label>
          <div className="sensors-toggle">
            {sensors.map(sensor => (
              <label key={sensor.column} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={visibleSensors[sensor.column] !== false}
                  onChange={(e) => setVisibleSensors(prev => ({
                    ...prev,
                    [sensor.column]: e.target.checked
                  }))}
                />
                <span 
                  className="sensor-color" 
                  style={{ backgroundColor: sensor.color || '#1e3a8a' }}
                ></span>
                <span className="sensor-name">{sensor.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Графік */}
      <div className="chart-section">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatDateForDisplay} 
                stroke="#000000" 
                fontSize={12}
              />
              <YAxis 
                stroke="#000000" 
                width={30} 
                domain={[yMin, yMax]} 
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {renderZones()}
              {activeSensors.map(sensor => (
                <Line
                  key={sensor.column}
                  type={lineType}
                  dataKey={sensor.column}
                  stroke={sensor.color || '#1e3a8a'}
                  strokeWidth={4}
                  strokeOpacity={1}
                  dot={false}
                  name={sensor.name}
                />
              ))}
              <ReferenceLine y={0} stroke="#9CA3AF" opacity={0.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Закріплена нижня панель */}
      <div className="bottom-panel">
        <div className="bottom-hamburger" onClick={() => setShowBottomPanel(!showBottomPanel)}>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </div>
        
        <div className={`bottom-controls ${showBottomPanel ? 'open' : ''}`}>
          <button onClick={onBackToStart} className="btn btn-secondary">🏠 На головну</button>
          <button onClick={onBackToDeveloper} className="btn btn-primary">⚙️ Налаштування</button>
        </div>
      </div>
    </div>
  );
};

export default UserMode;