import React, { useState, useEffect, useRef, useMemo } from 'react';
import './UserMode.css';
import SensorChart from './SensorChart';
import MainMenuPanel from './MainMenuPanel';
import PeriodPanel from './PeriodPanel';
import SensorsPanel from './SensorsPanel';
import { calculateMoistureForecast } from '../utils/moisturePrediction';

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMainMenu && 
          mainMenuRef.current && 
          mainMenuButtonRef.current &&
          !mainMenuRef.current.contains(event.target) &&
          !mainMenuButtonRef.current.contains(event.target)) {
        setShowMainMenu(false);
      }
      if (showPeriodPanel && periodPanelRef.current &&
          !periodPanelRef.current.contains(event.target)) {
        setShowPeriodPanel(false);
      }
      if (showSensorsPanel && sensorsPanelRef.current &&
          !sensorsPanelRef.current.contains(event.target)) {
        setShowSensorsPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMainMenu, showPeriodPanel, showSensorsPanel]);

  const activeSensor = useMemo(() => sensors.find(s => visibleSensors[s.column] !== false), [sensors, visibleSensors]);
  const forecast = useMemo(() => {
    if (!activeSensor || !config.xAxis || !data.length) return null;
    const sensorData = data.map(row => ({
      date: row[config.xAxis],
      value: parseFloat(row[activeSensor.column])
    })).filter(d => d.date && !isNaN(d.value));
    return calculateMoistureForecast(sensorData, 18);
  }, [data, config.xAxis, activeSensor]);

  if (!data || data.length === 0) {
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
      {/* === Графік === */}
      <div className="chart-section">
        <div className="chart-container">
          <SensorChart
            data={data}
            config={config}
            sensors={sensors}
            visibleSensors={visibleSensors}
            timeRange={timeRange}
          />
          {forecast && (
            <div className="forecast-info" style={{ marginTop: '16px', fontSize: '0.95rem', textAlign: 'center' }}>
              <p>
                Середня швидкість падіння вологості: <strong>{forecast.avgRate.toFixed(2)} %/год</strong><br />
                Прогноз досягнення 18%: <strong>{forecast.forecastHours} год</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* === Нижня панель === */}
      <div className="bottom-panel">
        <div className="hamburger-buttons">
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
          </div>

          {/* === Панелі === */}
          {showMainMenu && (
            <div ref={mainMenuRef}>
              <MainMenuPanel
                onOpenPeriod={() => {
                  setShowMainMenu(false);
                  setShowPeriodPanel(true);
                }}
                onOpenSensors={() => {
                  setShowMainMenu(false);
                  setShowSensorsPanel(true);
                }}
                onBackToSettings={() => {
                  setShowMainMenu(false);
                  onBackToDeveloper();
                }}
                onBackToHome={() => {
                  setShowMainMenu(false);
                  onBackToStart();
                }}
              />
            </div>
          )}

          {showPeriodPanel && (
            <div ref={periodPanelRef}>
              <PeriodPanel
                timeRange={timeRange}
                onSetTimeRange={(range) => {
                  setTimeRange(range);
                  setShowPeriodPanel(false);
                }}
                onBack={() => {
                  setShowPeriodPanel(false);
                  setShowMainMenu(true);
                }}
              />
            </div>
          )}

          {showSensorsPanel && (
            <div ref={sensorsPanelRef}>
              <SensorsPanel
                sensors={sensors}
                visibleSensors={visibleSensors}
                onToggleSensor={(col, checked) =>
                  setVisibleSensors(prev => ({ ...prev, [col]: checked }))
                }
                onBack={() => {
                  setShowSensorsPanel(false);
                  setShowMainMenu(true);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMode;
