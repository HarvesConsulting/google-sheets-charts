import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getSheetData } from './services/googleSheetsAPI';
import DeveloperMode from './components/DeveloperMode';
import UserMode from './components/UserMode';
import StartScreen from './components/StartScreen';
import './App.css';

function App() {
  const [currentMode, setCurrentMode] = useState('start');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState({
    sheetId: '',
    xAxis: '',
    chartTitle: 'Графік даних',
    xAxisLabel: 'Час',
    yAxisLabel: 'Значення'
  });
  const [sensors, setSensors] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);

  const sidebarRef = useRef(null);
  const overlayRef = useRef(null);

  // iOS фікс - блокуємо скролл body коли відкрита панель
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (showSidebar) {
        e.preventDefault();
      }
    };

    if (showSidebar) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [showSidebar]);

  // Фікс для iOS - примусово перемалювати компонент
  const forceReflow = (element) => {
    return element.offsetHeight; // Додаємо return
  };

  const handleOpenSidebar = () => {
    setShowSidebar(true);
    // Примусовий reflow для iOS
    setTimeout(() => {
      if (sidebarRef.current) {
        forceReflow(sidebarRef.current);
      }
    }, 50);
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
  };

  // Завантажуємо збережену конфігурацію при старті
  useEffect(() => {
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    const savedSensors = localStorage.getItem('googleSheetsSensors');
    
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      console.log('✅ Завантажено збережену конфігурацію');
    }
    
    if (savedSensors) {
      const parsedSensors = JSON.parse(savedSensors);
      setSensors(parsedSensors);
      console.log('✅ Завантажено збережені датчики:', parsedSensors.length);
    }
  }, []);

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
      setChartData(data || []);
      console.log('✅ Дані успішно завантажено:', data?.length, 'рядків');
      
      if (sheetId) {
        const newConfig = { ...config, sheetId };
        setConfig(newConfig);
      }
    } catch (err) {
      console.error('❌ Помилка завантаження:', err);
      setError('❌ Помилка завантаження даних. Перевірте ID таблиці та доступ.');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [config]);

  const handleConfigUpdate = (newConfig) => {
    setConfig(newConfig);
  };

  const handleSensorsUpdate = (newSensors) => {
    setSensors(newSensors);
  };

  const handleSaveConfig = () => {
    if (config.sheetId && config.xAxis && sensors.length > 0) {
      localStorage.setItem('googleSheetsConfig', JSON.stringify(config));
      localStorage.setItem('googleSheetsSensors', JSON.stringify(sensors));
      alert('✅ Конфігурацію успішно збережено!');
    } else {
      alert('⚠️ Заповніть всі обов\'язкові поля та додайте хоча б один датчик');
    }
  };

  const handleClearConfig = () => {
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
  };

  const handleEnterUserMode = () => {
    if (chartData.length > 0 && config.xAxis && sensors.length > 0) {
      setCurrentMode('user');
    } else {
      setError('Спочатку завантажте дані, оберіть вісь X та додайте хоча б один датчик');
    }
  };

  const handleInstagramClick = () => {
    window.open('https://www.instagram.com/harvest.consulting/', '_blank');
  };

  return (
    <div className="App">
      {/* Сендвіч-кнопка */}
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
                <button 
                  className="mode-btn"
                  onClick={() => {
                    setCurrentMode('start');
                    handleCloseSidebar();
                  }}
                >
                  Головна
                </button>
                <button 
                  className="mode-btn"
                  onClick={() => {
                    setCurrentMode('developer');
                    handleCloseSidebar();
                  }}
                >
                  Налаштування
                </button>
                <button 
                  className="mode-btn"
                  onClick={() => {
                    setCurrentMode('user');
                    handleCloseSidebar();
                  }}
                >
                  Графіки
                </button>
              </div>
            </div>

            <div className="menu-section">
              <h3>Про програму</h3>
              <p className="app-description">
                Інноваційна система моніторингу та аналізу даних для розумного поливу. 
                Дозволяє візуалізувати та аналізувати дані з ваших датчиків у реальному часі.
              </p>
            </div>
            
            <div className="menu-section">
              <h3>Контакти</h3>
              <button 
                className="instagram-btn"
                onClick={handleInstagramClick}
              >
                <span className="instagram-icon">📷</span>
                <span>Instagram: harvest.consulting</span>
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
        {currentMode === 'start' && (
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
        )}

        {currentMode === 'developer' && (
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
        )}

        {currentMode === 'user' && (
          <UserMode 
            data={chartData}
            config={config}
            sensors={sensors}
            onBackToStart={() => setCurrentMode('start')}
            onBackToDeveloper={() => setCurrentMode('developer')}
          />
        )}
      </div>
    </div>
  );
}

export default App;