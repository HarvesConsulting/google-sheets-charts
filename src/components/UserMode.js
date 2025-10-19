import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea
} from 'recharts';
import './UserMode.css';

const UserMode = ({ data, config, sensors, onBackToStart, onBackToDeveloper }) => {
  const [visibleSensors, setVisibleSensors] = useState({});
  const [timeRange, setTimeRange] = useState('7d');
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showPeriodPanel, setShowPeriodPanel] = useState(false);
  const [showSensorsPanel, setShowSensorsPanel] = useState(false);

  const mainMenuRef = useRef(null);
  const periodPanelRef = useRef(null);
  const sensorsPanelRef = useRef(null);
  const mainMenuButtonRef = useRef(null);

  useEffect(() => {
    const initialVisibility = {};
    sensors.forEach(sensor => {
      initialVisibility[sensor.column] = sensor.visible !== false;
    });
    setVisibleSensors(initialVisibility);
  }, [sensors]);

  // Обробник кліків поза меню та панелями
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Закриваємо головне меню
      if (showMainMenu && 
          mainMenuRef.current && 
          mainMenuButtonRef.current &&
          !mainMenuRef.current.contains(event.target) &&
          !mainMenuButtonRef.current.contains(event.target)) {
        setShowMainMenu(false);
      }
      
      // Закриваємо панель періоду
      if (showPeriodPanel && 
          periodPanelRef.current && 
          !periodPanelRef.current.contains(event.target)) {
        setShowPeriodPanel(false);
      }
      
      // Закриваємо панель датчиків
      if (showSensorsPanel && 
          sensorsPanelRef.current && 
          !sensorsPanelRef.current.contains(event.target)) {
        setShowSensorsPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMainMenu, showPeriodPanel, showSensorsPanel]);

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

  // Додайте в компонент
const AnimatedGradientLine = ({ dataKey, color, isActive }) => {
  return (
    <>
      <defs>
        <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.8}/>
          <stop offset="100%" stopColor={color} stopOpacity={0.1}/>
        </linearGradient>
      </defs>
      <Line
        type="monotone"
        dataKey={dataKey}
        stroke={`url(#gradient-${dataKey})`}
        strokeWidth={4}
        strokeLinecap="round"
        dot={false}
        activeDot={{
          r: 6,
          fill: color,
          stroke: "#fff",
          strokeWidth: 2
        }}
        name={sensors.find(s => s.column === dataKey)?.name}
        isAnimationActive={true}
        animationDuration={1000}
        animationEasing="ease-out"
      />
    </>
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

      {/* Закріплена нижня панель з однією сендвіч-кнопкою */}
      <div className="bottom-panel">
        <div className="hamburger-buttons">
          {/* Головна сендвіч-кнопка з меню */}
          <div className="hamburger-item">
            <div className="hamburger-button-wrapper">
              <div 
                ref={mainMenuButtonRef}
                className="hamburger-toggle main-menu-toggle" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMainMenu(!showMainMenu);
                  setShowPeriodPanel(false);
                  setShowSensorsPanel(false);
                }}
              >
                <div className="hamburger-line"></div>
                <div className="hamburger-line"></div>
                <div className="hamburger-line"></div>
              </div>
              <span className="hamburger-label">Меню</span>
            </div>
            
            {/* Головне меню */}
            {showMainMenu && (
              <div ref={mainMenuRef} className="controls-panel main-menu-panel open">
                <div className="controls-group">
                  <label>Управління:</label>
                  <div className="menu-buttons">
                    <button 
                      className="menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPeriodPanel(true);
                        setShowMainMenu(false);
                      }}
                    >
                      <span className="menu-icon">📅</span>
                      <span className="menu-text">Період даних</span>
                    </button>
                    
                    <button 
                      className="menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSensorsPanel(true);
                        setShowMainMenu(false);
                      }}
                    >
                      <span className="menu-icon">📊</span>
                      <span className="menu-text">Датчики</span>
                    </button>
                    
                    <button 
                      className="menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBackToDeveloper();
                        setShowMainMenu(false);
                      }}
                    >
                      <span className="menu-icon">⚙️</span>
                      <span className="menu-text">Налаштування</span>
                    </button>
                    
                    <button 
                      className="menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBackToStart();
                        setShowMainMenu(false);
                      }}
                    >
                      <span className="menu-icon">🏠</span>
                      <span className="menu-text">На головну</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Панель періоду */}
          {showPeriodPanel && (
            <div ref={periodPanelRef} className="controls-panel period-panel open">
              <div className="panel-header">
                <button 
                  className="back-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPeriodPanel(false);
                    setShowMainMenu(true);
                  }}
                >
                  ← Назад
                </button>
                <h3>Період даних</h3>
              </div>
              <div className="controls-group">
                <div className="time-buttons">
                  <button 
                    className={`time-btn ${timeRange === 'all' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeRange('all');
                      setShowPeriodPanel(false);
                    }}
                  >
                    Весь період
                  </button>
                  <button 
                    className={`time-btn ${timeRange === '7d' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeRange('7d');
                      setShowPeriodPanel(false);
                    }}
                  >
                    7 днів
                  </button>
                  <button 
                    className={`time-btn ${timeRange === '1d' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeRange('1d');
                      setShowPeriodPanel(false);
                    }}
                  >
                    Добу
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Панель датчиків */}
          {showSensorsPanel && (
            <div ref={sensorsPanelRef} className="controls-panel sensors-panel open">
              <div className="panel-header">
                <button 
                  className="back-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSensorsPanel(false);
                    setShowMainMenu(true);
                  }}
                >
                  ← Назад
                </button>
                <h3>Датчики</h3>
              </div>
              <div className="controls-group">
                <label>Вибір датчиків:</label>
                <div className="sensors-list">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMode;