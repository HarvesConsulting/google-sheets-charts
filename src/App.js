import React, { useState, useEffect, useCallback } from 'react';
import { getSheetData } from './services/googleSheetsAPI';
import DeveloperPanel from './components/DeveloperPanel';
import UserView from './components/UserView';
import './App.css';

function App() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(300000);
  const [isDeveloperMode, setIsDeveloperMode] = useState(true);
  const [sensors, setSensors] = useState([
    { name: 'Шпалера', column: 'Шпалера', color: '#0088FE', visible: true, type: 'line' }
  ]);
  
  const [config, setConfig] = useState({
    sheetId: '',
    sheetName: 'AppSheetView',
    range: 'A:Z',
    dateColumn: 'ДатаЧас'
  });

  const fetchData = useCallback(async () => {
    if (!config.sheetId) {
      setError('⚠️ Будь ласка, введіть ID таблиці');
      setChartData([]);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await getSheetData(config.sheetId, config.sheetName, config.range);
      setChartData(data || []);
      setLastUpdate(new Date());
      console.log('Дані успішно завантажено:', data);
    } catch (err) {
      console.error('Помилка завантаження:', err);
      setError('❌ Помилка завантаження даних. Перевірте ID таблиці та налаштування.');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [config.sheetId, config.sheetName, config.range]);

  // Завантажуємо дані при зміні ID таблиці
  useEffect(() => {
    if (config.sheetId) {
      fetchData();
    } else {
      setChartData([]);
      setError('⚠️ Будь ласка, введіть ID таблиці');
    }
  }, [config.sheetId, fetchData]);

  // Автооновлення
  useEffect(() => {
    let intervalId;

    if (autoRefresh && config.sheetId) {
      intervalId = setInterval(() => {
        console.log('Автоматичне оновлення даних...');
        fetchData();
      }, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, config.sheetId, fetchData]);

  const handleConfigUpdate = (newConfig) => {
    setConfig(newConfig);
    // Не завантажуємо дані автоматично - користувач сам натисне "Оновити"
  };

  const handleSensorsUpdate = (newSensors) => {
    setSensors(newSensors);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleIntervalChange = (minutes) => {
    setRefreshInterval(minutes * 60000);
  };

  const toggleDeveloperMode = () => {
    setIsDeveloperMode(!isDeveloperMode);
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '---';
    return lastUpdate.toLocaleTimeString('uk-UA');
  };

  // Функція для скидання помилки
  const clearError = () => {
    setError('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📊 Система моніторингу датчиків</h1>
        <p>Динамічні графіки з Google Sheets</p>
        
        <div className="mode-switcher">
          <button 
            className={`mode-btn ${isDeveloperMode ? 'mode-active' : 'mode-inactive'}`}
            onClick={toggleDeveloperMode}
          >
            {isDeveloperMode ? '👨‍💻 Режим розробника' : '👤 Режим користувача'}
          </button>
        </div>
      </header>
      
      <div className="container">
        {isDeveloperMode ? (
          // РЕЖИМ РОЗРОБНИКА - завжди доступний
          <>
            {error && (
              <div className="error-with-retry">
                <div className="error-message">{error}</div>
                <button onClick={clearError} className="btn btn-secondary btn-small">
                  ✖️ Сховати помилку
                </button>
                <button onClick={fetchData} className="btn btn-primary btn-small">
                  🔄 Спробувати знову
                </button>
              </div>
            )}
            
            <DeveloperPanel 
              config={config}
              onConfigUpdate={handleConfigUpdate}
              data={chartData}
              onRefresh={fetchData}
              sensors={sensors}
              onSensorsUpdate={handleSensorsUpdate}
            />
            
            <div className="auto-refresh-panel">
              <h3>🔄 Автооновлення</h3>
              <div className="refresh-controls">
                <button 
                  className={`btn ${autoRefresh ? 'btn-active' : 'btn-inactive'}`}
                  onClick={toggleAutoRefresh}
                  disabled={!config.sheetId}
                >
                  {autoRefresh ? '⏸️ Призупинити' : '▶️ Увімкнути'} автооновлення
                </button>
                
                <div className="interval-controls">
                  <label>Інтервал:</label>
                  <select 
                    value={refreshInterval / 60000} 
                    onChange={(e) => handleIntervalChange(Number(e.target.value))}
                    disabled={!autoRefresh || !config.sheetId}
                  >
                    <option value={1}>1 хвилина</option>
                    <option value={2}>2 хвилини</option>
                    <option value={5}>5 хвилин</option>
                    <option value={10}>10 хвилин</option>
                    <option value={15}>15 хвилин</option>
                  </select>
                </div>
                
                <div className="last-update">
                  ⏰ Останнє оновлення: {formatLastUpdate()}
                </div>
              </div>
            </div>

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                Завантаження даних...
              </div>
            )}
          </>
        ) : (
          // РЕЖИМ КОРИСТУВАЧА - тільки якщо є дані
          <>
            {error && (
              <div className="error">
                {error}
                <button onClick={toggleDeveloperMode} className="btn btn-primary btn-small">
                  ⚙️ Перейти до налаштувань
                </button>
              </div>
            )}
            
            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                Завантаження даних...
              </div>
            )}

            {!loading && !error && chartData.length > 0 ? (
              <UserView 
                data={chartData}
                config={config}
                sensors={sensors.filter(sensor => sensor.visible)}
                lastUpdate={lastUpdate}
              />
            ) : (
              !loading && !error && (
                <div className="no-data-user">
                  <h3>📊 Немає даних для відображення</h3>
                  <p>Перейдіть в режим розробника для налаштування підключення</p>
                  <button onClick={toggleDeveloperMode} className="btn btn-primary">
                    👨‍💻 Перейти до налаштувань
                  </button>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;