import React, { useState, useEffect } from 'react';
import { getSheetData } from './services/googleSheetsAPI';
import ChartContainer from './components/ChartContainer';
import SheetConfig from './components/SheetConfig';
import './App.css';

function App() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Конфігурація за замовчуванням
  const [config, setConfig] = useState({
    sheetId: '',
    sheetName: 'Sheet1',
    range: 'A:Z',
    xAxis: 'Favorite',
    yAxis: 'Count'
  });

  const fetchData = async () => {
    if (!config.sheetId) {
      setError('⚠️ Будь ласка, введіть ID таблиці');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await getSheetData(config.sheetId, config.sheetName, config.range);
      setChartData(data);
      console.log('Дані успішно завантажено:', data);
    } catch (err) {
      setError('❌ Помилка завантаження даних. Перевірте ID таблиці та налаштування.');
      console.error('Помилка:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config.sheetId) {
      fetchData();
    }
  }, [config]);

  const handleConfigUpdate = (newConfig) => {
    setConfig(newConfig);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📊 Графіки з Google Sheets</h1>
        <p>Відображення даних з Google Tables у вигляді графіків</p>
      </header>
      
      <div className="container">
        <SheetConfig 
          config={config} 
          onConfigUpdate={handleConfigUpdate}
          onRefresh={fetchData}
        />
        
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            Завантаження даних...
          </div>
        )}
        
        {error && <div className="error">{error}</div>}
        
        {!loading && !error && chartData.length > 0 && (
          <ChartContainer 
            data={chartData} 
            config={config}
          />
        )}

        {!loading && !error && config.sheetId && chartData.length === 0 && (
          <div className="no-data">
            📭 Дані не знайдено. Перевірте назви колонок у налаштуваннях.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;