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

  return (
    <div className="App">
      <header className="App-header">
        <h1>📊 Data Visualizer Pro</h1>
        <p>Професійна візуалізація даних з Google Sheets</p>
      </header>
      
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