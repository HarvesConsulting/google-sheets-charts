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
    yAxis: '',
    chartTitle: 'Графік даних',
    xAxisLabel: 'Час',
    yAxisLabel: 'Значення'
  });

  // Завантажуємо збережену конфігурацію при старті
  useEffect(() => {
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      console.log('✅ Завантажено збережену конфігурацію');
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

  const handleSaveConfig = () => {
    if (config.sheetId && config.xAxis && config.yAxis) {
      localStorage.setItem('googleSheetsConfig', JSON.stringify(config));
      alert('✅ Конфігурацію успішно збережено!');
    } else {
      alert('⚠️ Заповніть всі обов\'язкові поля перед збереженням');
    }
  };

  const handleClearConfig = () => {
    localStorage.removeItem('googleSheetsConfig');
    setConfig({
      sheetId: '',
      xAxis: '',
      yAxis: '',
      chartTitle: 'Графік даних',
      xAxisLabel: 'Час',
      yAxisLabel: 'Значення'
    });
    setChartData([]);
    alert('✅ Конфігурацію очищено!');
  };

  const handleEnterUserMode = () => {
    if (chartData.length > 0 && config.xAxis && config.yAxis) {
      setCurrentMode('user');
    } else {
      setError('Спочатку завантажте дані та оберіть осі X та Y');
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
              if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                setConfig(parsedConfig);
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
            onConfigUpdate={handleConfigUpdate}
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
            onBackToStart={() => setCurrentMode('start')}
            onBackToDeveloper={() => setCurrentMode('developer')}
          />
        )}
      </div>
    </div>
  );
}

export default App;