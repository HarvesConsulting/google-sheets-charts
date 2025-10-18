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
    { name: 'Шпалера', column: 'Шпалера', color: '#0088FE', visible: true }
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
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await getSheetData(config.sheetId, config.sheetName, config.range);
      setChartData(data);
      setLastUpdate(new Date());
      console.log('Дані успішно завантажено:', data);
    } catch (err) {
      setError('❌ Помилка завантаження даних. Перевірте ID таблиці та налаштування.');
      console.error('Помилка:', err);
    } finally {
      setLoading(false);
    }
  }, [config.sheetId, config.sheetName, config.range]);

  useEffect(() => {
    if (config.sheetId) {
      fetchData();
    }
  }, [config.sheetId, fetchData]);

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>📊 Система моніторингу датчиків</h1>
        <p>Динамічні графіки з Google Sheets</p>
        
        <div className="mode-switcher">
          <button 
            className={`btn ${isDeveloperMode ? 'btn-active' : 'btn-inactive'}`}
            onClick={toggleDeveloperMode}
          >
            {isDeveloperMode ? '👨‍💻 Режим розробника' : '👤 Режим користувача'}
          </button>
        </div>
      </header>
      
      <div className="container">
        {isDeveloperMode ? (
          // Режим розробника
          <>
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
                >
                  {autoRefresh ? '⏸️ Призупинити' : '▶️ Увімкнути'} автооновлення
                </button>
                
                <div className="interval-controls">
                  <label>Інтервал:</label>
                  <select 
                    value={refreshInterval / 60000} 
                    onChange={(e) => handleIntervalChange(Number(e.target.value))}
                    disabled={!autoRefresh}
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
          </>
        ) : (
          // Режим користувача
          <UserView 
            data={chartData}
            config={config}
            sensors={sensors}
            loading={loading}
            error={error}
            lastUpdate={lastUpdate}
          />
        )}
        
        {/* Загальні елементи */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            Завантаження даних...
          </div>
        )}
        
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

export default App;