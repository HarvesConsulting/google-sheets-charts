import React, { useState, useCallback, useEffect } from 'react';
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
      {/* Синій верхній бар ТІЛЬКИ з сендвіч-кнопкою */}
      <header className="top-header">
        <div className="header-content">
          <button 
            className="hamburger-btn"
            onClick={() => setShowSidebar(!showSidebar)}
            aria-label="Відкрити меню"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          {/* Заголовок прибраний - залишаємо тільки кнопку */}
        </div>
      </header>

      {/* Бічна панель */}
      <div className={`sidebar ${showSidebar ? 'sidebar-open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2>РОЗУМНИЙ ПОЛИВ</h2>
            <p>від HarvestConsulting</p>
            <button 
              className="sidebar-close"
              onClick={() => setShowSidebar(false)}
              aria-label="Закрити меню"
            >
              ×
            </button>
          </div>
          
          <div className="sidebar-menu">
            {/* Секція Режими - ТЕПЕР ЗВЕРХУ */}
            <div className="menu-section">
              <h3>Режими</h3>
              <div className="mode-buttons">
                <button 
                  className="mode-btn"
                  onClick={() => {
                    setCurrentMode('start');
                    setShowSidebar(false);
                  }}
                >
                  Головна
                </button>
                <button 
                  className="mode-btn"
                  onClick={() => {
                    setCurrentMode('developer');
                    setShowSidebar(false);
                  }}
                >
                  Налаштування
                </button>
                <button 
                  className="mode-btn"
                  onClick={() => {
                    setCurrentMode('user');
                    setShowSidebar(false);
                  }}
                >
                  Графіки
                </button>
              </div>
            </div>

            {/* Секція Про програму - ТЕПЕР ПОСЕРЕДИНІ */}
            <div className="menu-section">
              <h3>Про програму</h3>
              <p className="app-description">
                Інноваційна система моніторингу та аналізу даних для розумного поливу. 
                Дозволяє візуалізувати та аналізувати дані з ваших датчиків у реальному часі.
              </p>
            </div>
            
            {/* Секція Контакти - ТЕПЕР ВНИЗУ */}
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
        
        {/* Затемнення фону */}
        <div 
          className="sidebar-overlay"
          onClick={() => setShowSidebar(false)}
        />
      </div>
      
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