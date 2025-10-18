import React, { useState, useCallback } from 'react';
import { getSheetData } from './services/googleSheetsAPI';
import DeveloperMode from './components/DeveloperMode';
import UserMode from './components/UserMode';
import StartScreen from './components/StartScreen';
import './App.css';

function App() {
  const [currentMode, setCurrentMode] = useState('start'); // 'start', 'developer', 'user'
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState({
    sheetId: '',
    xAxis: 'ДатаЧас',
    yAxis: 'Шпалера'
  });

  const fetchData = useCallback(async () => {
    if (!config.sheetId) {
      setError('⚠️ Будь ласка, введіть ID таблиці');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await getSheetData(config.sheetId, 'AppSheetView', 'A:Z');
      setChartData(data || []);
      console.log('Дані успішно завантажено:', data?.length, 'рядків');
    } catch (err) {
      console.error('Помилка завантаження:', err);
      setError('❌ Помилка завантаження даних. Перевірте ID таблиці.');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [config.sheetId]);

  const handleConfigUpdate = (newConfig) => {
    setConfig(newConfig);
  };

  const handleEnterUserMode = () => {
    if (chartData.length > 0) {
      setCurrentMode('user');
    } else {
      setError('Спочатку завантажте дані в режимі розробника');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📊 Google Sheets Charts</h1>
        <p>Простий перегляд графіків з Google Tables</p>
      </header>
      
      <div className="container">
        {currentMode === 'start' && (
          <StartScreen 
            onDeveloperMode={() => setCurrentMode('developer')}
            onUserMode={() => setCurrentMode('user')}
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