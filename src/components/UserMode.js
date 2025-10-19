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

  // Додаємо дебаг інформацію
  useEffect(() => {
    console.log('📊 UserMode отримав дані:', {
      dataLength: data?.length,
      config,
      sensorsCount: sensors?.length,
      visibleSensors
    });
  }, [data, config, sensors, visibleSensors]);

  // Ініціалізація видимості сенсорів
  useEffect(() => {
    const initialVisibility = {};
    sensors.forEach(sensor => {
      initialVisibility[sensor.column] = sensor.visible !== false;
    });
    setVisibleSensors(initialVisibility);
    console.log('👁️ Ініціалізація видимості сенсорів:', initialVisibility);
  }, [sensors]);

  // Обробник кліків поза меню
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMainMenu && 
          mainMenuRef.current && 
          !mainMenuRef.current.contains(event.target) &&
          mainMenuButtonRef.current &&
          !mainMenuButtonRef.current.contains(event.target)) {
        setShowMainMenu(false);
      }
      
      if (showPeriodPanel && 
          periodPanelRef.current && 
          !periodPanelRef.current.contains(event.target)) {
        setShowPeriodPanel(false);
      }
      
      if (showSensorsPanel && 
          sensorsPanelRef.current && 
          !sensorsPanelRef.current.contains(event.target)) {
        setShowSensorsPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMainMenu, showPeriodPanel, showSensorsPanel]);

  // Функції для роботи з датами
  const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
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

  // Підготовка даних для графіка
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      console.log('❌ Немає вхідних даних для графіка');
      return [];
    }

    console.log('🔄 Підготовка даних для графіка, вхідних рядків:', data.length);

    const processedData = data.map((row, index) => {
      const rawDate = row[config.xAxis];
      const timestamp = parseDate(rawDate);
      
      if (!timestamp) {
        console.log(`⚠️ Не вдалося розпарсити дату: ${rawDate} у рядку ${index}`);
        return null;
      }

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

    console.log('✅ Оброблено точок даних:', processedData.length);

    // Сортування за часом
    processedData.sort((a, b) => a.timestamp - b.timestamp);

    // Фільтрація за періодом
    if (timeRange !== 'all' && processedData.length > 0) {
      const now = processedData[processedData.length - 1].timestamp;
      const rangeMs = {
        '1d': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      }[timeRange];

      if (rangeMs) {
        const cutoff = now - rangeMs;
        const filteredData = processedData.filter(d => d.timestamp >= cutoff);
        console.log(`⏰ Фільтрація за періодом ${timeRange}: ${processedData.length} -> ${filteredData.length} точок`);
        return filteredData;
      }
    }

    return processedData;
  }, [data, config.xAxis, sensors, visibleSensors, timeRange]);

  // Активні сенсори
  const activeSensors = useMemo(() => {
    const active = sensors.filter(sensor => visibleSensors[sensor.column] !== false);
    console.log('🎯 Активні сенсори:', active);
    return active;
  }, [sensors, visibleSensors]);

  // Розрахунок статистики поливів
  const wateringStats = useMemo(() => {
    if (!chartData || chartData.length === 0 || activeSensors.length === 0) {
      console.log('❌ Немає даних для розрахунку статистики поливів');
      return { wateringCount: 0, averageInterval: 0 };
    }

    console.log('💧 Розрахунок статистики поливів з', chartData.length, 'точок');

    const mainSensor = activeSensors[0];
    const wateringEvents = [];
    const intervals = [];

    // Пошук подій поливу
    for (let i = 1; i < chartData.length; i++) {
      const current = chartData[i];
      const previous = chartData[i - 1];
      
      const currentVal = current[mainSensor.column];
      const previousVal = previous[mainSensor.column];

      if (currentVal !== null && previousVal !== null) {
        const increase = currentVal - previousVal;
        
        if (increase > 5) {
          wateringEvents.push({
            timestamp: current.timestamp,
            increase: increase
          });

          // Розрахунок інтервалу
          if (wateringEvents.length > 1) {
            const prevEvent = wateringEvents[wateringEvents.length - 2];
            const intervalHours = (current.timestamp - prevEvent.timestamp) / (1000 * 60 * 60);
            intervals.push(intervalHours);
          }
        }
      }
    }

    const wateringCount = wateringEvents.length;
    const averageInterval = intervals.length > 0 
      ? intervals.reduce((sum, int) => sum + int, 0) / intervals.length 
      : 0;

    console.log('📈 Статистика поливів:', { wateringCount, averageInterval, events: wateringEvents.length });

    return {
      wateringCount,
      averageInterval: Math.round(averageInterval * 10) / 10
    };
  }, [chartData, activeSensors]);

  // Діапазон для Y осі
  const yAxisRange = useMemo(() => {
    if (chartData.length === 0) {
      console.log('📏 Графік порожній, використовуються значення за замовчуванням');
      return { yMin: 0, yMax: 24 };
    }
    
    const allValues = chartData.flatMap(point => 
      activeSensors.map(sensor => point[sensor.column]).filter(val => val !== null)
    );
    
    if (allValues.length === 0) {
      console.log('📏 Немає значень для Y осі');
      return { yMin: 0, yMax: 24 };
    }
    
    let yMin = Math.min(...allValues);
    let yMax = Math.max(...allValues);
    
    const padding = (yMax - yMin) * 0.1;
    yMin = Math.max(0, yMin - padding);
    yMax += padding;
    
    console.log('📏 Діапазон Y осі:', { yMin, yMax, valuesCount: allValues.length });
    
    return { yMin, yMax };
  }, [chartData, activeSensors]);

  // Кастомний тултіп
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="custom-tooltip">
        <div className="tooltip-header">
          {formatTooltipDate(label)}
        </div>
        {payload.map((entry, i) => (
          <div key={i} className="tooltip-item">
            <div 
              className="tooltip-color" 
              style={{ backgroundColor: entry.color || '#1e3a8a' }}
            />
            <strong style={{ color: entry.color || '#1e3a8a' }}>
              {entry.name}:
            </strong>
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Зони на графіку
  const renderZones = () => (
    <>
      <ReferenceArea 
        y1={0} 
        y2={6} 
        fill="#ff4444" 
        fillOpacity={0.15}
        stroke="none"
      />
      <ReferenceArea 
        y1={6} 
        y2={18} 
        fill="#ffcc00" 
        fillOpacity={0.15}
        stroke="none"
      />
      <ReferenceArea 
        y1={18} 
        y2={yAxisRange.yMax} 
        fill="#44ff44" 
        fillOpacity={0.15}
        stroke="none"
      />
      <ReferenceLine y={6} stroke="#ff4444" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.6} />
      <ReferenceLine y={18} stroke="#44ff44" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.6} />
    </>
  );

  // Обробники подій
  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMainMenu(!showMainMenu);
    setShowPeriodPanel(false);
    setShowSensorsPanel(false);
  };

  const handlePeriodSelect = (range) => {
    setTimeRange(range);
    setShowPeriodPanel(false);
  };

  const handleSensorToggle = (sensorColumn, checked) => {
    setVisibleSensors(prev => ({
      ...prev,
      [sensorColumn]: checked
    }));
  };

  // Стан без даних
  if (!data || data.length === 0 || chartData.length === 0) {
    console.log('🚨 Відображення стану без даних:', {
      hasData: !!data,
      dataLength: data?.length,
      chartDataLength: chartData?.length,
      config,
      sensors: sensors?.length
    });
    
    return (
      <div className="user-mode">
        <div className="no-data">
          <div className="no-data-icon">📭</div>
          <h2>Немає даних для побудови графіка</h2>
          <p>Перевірте налаштування даних або спробуйте інший період</p>
          <div className="debug-info">
            <p><strong>Дані для дебагу:</strong></p>
            <p>Отримано рядків: {data?.length || 0}</p>
            <p>Оброблено точок: {chartData?.length || 0}</p>
            <p>Вісь X: {config.xAxis || 'не вибрана'}</p>
            <p>Датчики: {sensors?.length || 0}</p>
          </div>
          <button onClick={onBackToDeveloper} className="btn btn-primary">
            🔧 Повернутись до налаштувань
          </button>
        </div>
      </div>
    );
  }

  console.log('🎨 Відображення графіка з', chartData.length, 'точками');

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
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                opacity={0.4}
                vertical={false}
              />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatDateForDisplay} 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                stroke="#64748b" 
                width={35} 
                domain={[yAxisRange.yMin, yAxisRange.yMax]} 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {renderZones()}
              {activeSensors.map(sensor => (
                <Line
                  key={sensor.column}
                  type="monotone"
                  dataKey={sensor.column}
                  stroke={sensor.color || '#3b82f6'}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: '#fff',
                    stroke: sensor.color || '#3b82f6',
                    strokeWidth: 3
                  }}
                  name={sensor.name}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Статистика поливів */}
      <div className="watering-stats">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-icon">💧</div>
            <div className="stat-content">
              <div className="stat-value">{wateringStats.wateringCount}</div>
              <div className="stat-label">кількість зволожень</div>
              <div className="stat-description">збільшення вологості більше ніж на 5%</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">{wateringStats.averageInterval} год</div>
              <div className="stat-label">середній інтервал</div>
              <div className="stat-description">між поливами</div>
            </div>
          </div>
        </div>
      </div>

      {/* Нижня панель керування */}
      <div className="bottom-panel">
        <div className="hamburger-buttons">
          <div className="hamburger-item">
            <div className="hamburger-button-wrapper">
              <div 
                ref={mainMenuButtonRef}
                className="hamburger-toggle" 
                onClick={handleMenuToggle}
              >
                <div className="hamburger-line"></div>
                <div className="hamburger-line"></div>
                <div className="hamburger-line"></div>
              </div>
              <span className="hamburger-label">Меню</span>
            </div>
            
            {showMainMenu && (
              <div ref={mainMenuRef} className="controls-panel main-menu-panel">
                <div className="controls-group">
                  <label>Управління:</label>
                  <div className="menu-buttons">
                    <button 
                      className="menu-btn"
                      onClick={() => {
                        setShowPeriodPanel(true);
                        setShowMainMenu(false);
                      }}
                    >
                      <span className="menu-icon">📅</span>
                      <span>Період даних</span>
                    </button>
                    
                    <button 
                      className="menu-btn"
                      onClick={() => {
                        setShowSensorsPanel(true);
                        setShowMainMenu(false);
                      }}
                    >
                      <span className="menu-icon">📊</span>
                      <span>Датчики</span>
                    </button>
                    
                    <button 
                      className="menu-btn"
                      onClick={onBackToDeveloper}
                    >
                      <span className="menu-icon">⚙️</span>
                      <span>Налаштування</span>
                    </button>
                    
                    <button 
                      className="menu-btn"
                      onClick={onBackToStart}
                    >
                      <span className="menu-icon">🏠</span>
                      <span>На головну</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showPeriodPanel && (
            <div ref={periodPanelRef} className="controls-panel period-panel">
              <div className="panel-header">
                <button 
                  className="back-button"
                  onClick={() => setShowPeriodPanel(false)}
                >
                  ← Назад
                </button>
                <h3>Період даних</h3>
              </div>
              <div className="time-buttons">
                <button 
                  className={`time-btn ${timeRange === 'all' ? 'active' : ''}`}
                  onClick={() => handlePeriodSelect('all')}
                >
                  Весь період
                </button>
                <button 
                  className={`time-btn ${timeRange === '7d' ? 'active' : ''}`}
                  onClick={() => handlePeriodSelect('7d')}
                >
                  7 днів
                </button>
                <button 
                  className={`time-btn ${timeRange === '1d' ? 'active' : ''}`}
                  onClick={() => handlePeriodSelect('1d')}
                >
                  Добу
                </button>
              </div>
            </div>
          )}

          {showSensorsPanel && (
            <div ref={sensorsPanelRef} className="controls-panel sensors-panel">
              <div className="panel-header">
                <button 
                  className="back-button"
                  onClick={() => setShowSensorsPanel(false)}
                >
                  ← Назад
                </button>
                <h3>Датчики</h3>
              </div>
              <div className="sensors-list">
                {sensors.map(sensor => (
                  <label key={sensor.column} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={visibleSensors[sensor.column] !== false}
                      onChange={(e) => handleSensorToggle(sensor.column, e.target.checked)}
                    />
                    <span 
                      className="sensor-color" 
                      style={{ backgroundColor: sensor.color || '#1e3a8a' }}
                    />
                    <span className="sensor-name">{sensor.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMode;