import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { getSheetData } from './services/googleSheetsAPI';
import './App.css';

// Ліниве завантаження компонентів для кращої швидкості
const StartScreen = lazy(() => import('./components/StartScreen'));
const DeveloperMode = lazy(() => import('./components/DeveloperMode'));
const UserMode = lazy(() => import('./components/UserMode'));

// Loading компонент
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Завантаження...</p>
  </div>
);

function App() {
  const [currentMode, setCurrentMode] = useState('start');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(() => {
    // Лінива ініціалізація стану
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    return savedConfig ? JSON.parse(savedConfig) : {
      sheetId: '',
      xAxis: '',
      chartTitle: 'Графік даних',
      xAxisLabel: 'Час',
      yAxisLabel: 'Значення'
    };
  });
  const [sensors, setSensors] = useState(() => {
    const savedSensors = localStorage.getItem('googleSheetsSensors');
    return savedSensors ? JSON.parse(savedSensors) : [];
  });
  const [showSidebar, setShowSidebar] = useState(false);

  const sidebarRef = useRef(null);
  const overlayRef = useRef(null);

  // Оптимізований iOS фікс
  useEffect(() => {
    if (!showSidebar) return;

    const handleTouchMove = (e) => e.preventDefault();
    
    document.body.style.overflow = 'hidden';
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [showSidebar]);

  const handleOpenSidebar = () => setShowSidebar(true);
  const handleCloseSidebar = () => setShowSidebar(false);

  // Оптимізований fetchData
  const fetchData = useCallback(async (sheetId = config.sheetId) => {
    const targetSheetId = sheetId || config.sheetId;
    
    if (!targetSheetId) {
      setError('⚠️ Будь ласка, введіть ID таблиці');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await getSheetData(targetSheetId, 'AppSheetView', 'A:Z');
      
      if (data?.length > 0) {
        setChartData(data);
      } else {
        setError('❌ Таблиця порожня або не містить даних');
        setChartData([]);
      }
      
      if (sheetId && sheetId !== config.sheetId) {
        setConfig(prev => ({ ...prev, sheetId }));
      }
    } catch (err) {
      setError('❌ Помилка завантаження даних. Перевірте ID таблиці та доступ.');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [config.sheetId]);

  // Оптимізовані обробники
  const handleConfigUpdate = useCallback((newConfig) => {
    setConfig(newConfig);
  }, []);

  const handleSensorsUpdate = useCallback((newSensors) => {
    setSensors(newSensors);
  }, []);

  const handleSaveConfig = useCallback(() => {
    if (config.sheetId && config.xAxis && sensors.length > 0) {
      localStorage.setItem('googleSheetsConfig', JSON.stringify(config));
      localStorage.setItem('googleSheetsSensors', JSON.stringify(sensors));
      alert('✅ Конфігурацію успішно збережено!');
    } else {
      alert('⚠️ Заповніть всі обов\'язкові поля та додайте хоча б один датчик');
    }
  }, [config, sensors]);

  const handleClearConfig = useCallback(() => {
    localStorage.removeItem('googleSheetsConfig');
    localStorage.removeItem('googleSheetsSensors');
    setConfig({
      sheetId: '',
      xAxis: '',
      chartTitle: 'Графік даних',
      xAxisLabel: 'Час',
      yAxisLabel: 'Значення'
    });
    setSensors([]);
    setChartData([]);
    alert('✅ Конфігурацію очищено!');
  }, []);

  const handleEnterUserMode = useCallback(() => {
    if (chartData.length > 0 && config.xAxis && sensors.length > 0) {
      setCurrentMode('user');
    } else {
      setError('Спочатку завантажте дані, оберіть вісь X та додайте хоча б один датчик');
    }
  }, [chartData, config.xAxis, sensors]);

  const handleInstagramClick = () => {
    window.open('https://www.instagram.com/harvest.consulting/', '_blank', 'noopener,noreferrer');
  };

  const renderCurrentMode = () => {
    switch (currentMode) {
      case 'start':
        return (
          <StartScreen 
            onDeveloperMode={() => setCurrentMode('developer')}
            onUserMode={() => {
              const savedConfig = localStorage.getItem('googleSheetsConfig');
              const savedSensors = localStorage.getItem('googleSheetsSensors');
              
              if (savedConfig && savedSensors) {
                const parsedConfig = JSON.parse(savedConfig);
                const parsedSensors = JSON.parse(savedSensors);
                setConfig(parsedConfig);
                setSensors(parsedSensors);
                fetchData(parsedConfig.sheetId).then(() => {
                  setCurrentMode('user');
                });
              } else {
                setCurrentMode('user');
              }
            }}
            hasSavedConfig={!!localStorage.getItem('googleSheetsConfig')}
          />
        );
      case 'developer':
        return (
          <DeveloperMode 
            config={config}
            data={chartData}
            loading={loading}
            error={error}
            sensors={sensors}
            onConfigUpdate={handleConfigUpdate}
            onSensorsUpdate={handleSensorsUpdate}
            onFetchData={fetchData}
            onEnterUserMode={handleEnterUserMode}
            onSaveConfig={handleSaveConfig}
            onClearConfig={handleClearConfig}
          />
        );
      case 'user':
        return (
          <UserMode 
            data={chartData}
            config={config}
            sensors={sensors}
            onBackToStart={() => setCurrentMode('start')}
            onBackToDeveloper={() => setCurrentMode('developer')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="App">
      {/* Оптимізована сендвіч-кнопка */}
      <button 
        className="hamburger-btn"
        onClick={handleOpenSidebar}
        aria-label="Відкрити меню"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Бічна панель */}
      <div 
        ref={sidebarRef}
        className={`sidebar ${showSidebar ? 'sidebar-open' : ''}`}
      >
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2>РОЗУМНИЙ ПОЛИВ</h2>
            <p>від HarvestConsulting</p>
            <button 
              className="sidebar-close"
              onClick={handleCloseSidebar}
              aria-label="Закрити меню"
            >
              ×
            </button>
          </div>
          
          <div className="sidebar-menu">
            <div className="menu-section">
              <h3>Режими</h3>
              <div className="mode-buttons">
                <button className="mode-btn" onClick={() => { setCurrentMode('start'); handleCloseSidebar(); }}>
                  🏠 Головна
                </button>
                <button className="mode-btn" onClick={() => { setCurrentMode('developer'); handleCloseSidebar(); }}>
                  ⚙️ Налаштування
                </button>
                <button className="mode-btn" onClick={() => { setCurrentMode('user'); handleCloseSidebar(); }}>
                  📊 Графіки
                </button>
              </div>
            </div>

            <div className="menu-section">
              <h3>Про програму</h3>
              <p className="app-description">
                Інноваційна система моніторингу та аналізу даних для розумного поливу
              </p>
            </div>
            
            <div className="menu-section">
              <h3>Контакти</h3>
              <button className="instagram-btn" onClick={handleInstagramClick}>
                <span className="instagram-icon">📷</span>
                <span>harvest.consulting</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay */}
      {showSidebar && (
        <div 
          ref={overlayRef}
          className="sidebar-overlay"
          onClick={handleCloseSidebar}
        />
      )}
      
      <div className="container">
        <Suspense fallback={<LoadingSpinner />}>
          {renderCurrentMode()}
        </Suspense>
      </div>
    </div>
  );
}

export default React.memo(App);