import React, { useState, useEffect } from 'react';
import { getAvailableColumns } from '../services/googleSheetsAPI';
import './DeveloperPanel.css';

const DeveloperPanel = ({ 
  config, 
  onConfigUpdate, 
  data, 
  onRefresh,
  sensors,
  onSensorsUpdate 
}) => {
  const [localConfig, setLocalConfig] = useState({
    sheetId: config.sheetId || '',
    sheetName: config.sheetName || 'AppSheetView',
    range: config.range || 'A:Z'
  });
  
  const [availableColumns, setAvailableColumns] = useState([]);
  const [localSensors, setLocalSensors] = useState(sensors || []);
  const [previewData, setPreviewData] = useState([]);

  // Отримуємо доступні колонки при зміні даних
  useEffect(() => {
    if (data && data.length > 0) {
      const columns = getAvailableColumns(data);
      setAvailableColumns(columns);
      setPreviewData(data.slice(0, 5)); // Перші 5 рядків для прев'ю
    }
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfigUpdate(localConfig);
    onSensorsUpdate(localSensors);
  };

  const handleConfigChange = (field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSensorChange = (index, field, value) => {
    const updatedSensors = [...localSensors];
    updatedSensors[index] = {
      ...updatedSensors[index],
      [field]: value
    };
    setLocalSensors(updatedSensors);
  };

  const addSensor = () => {
    const newSensor = {
      name: `Датчик ${localSensors.length + 1}`,
      column: '',
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      visible: true,
      type: 'line'
    };
    setLocalSensors(prev => [...prev, newSensor]);
  };

  const removeSensor = (index) => {
    setLocalSensors(prev => prev.filter((_, i) => i !== index));
  };

  const moveSensor = (index, direction) => {
    const newSensors = [...localSensors];
    if (direction === 'up' && index > 0) {
      [newSensors[index], newSensors[index - 1]] = [newSensors[index - 1], newSensors[index]];
    } else if (direction === 'down' && index < newSensors.length - 1) {
      [newSensors[index], newSensors[index + 1]] = [newSensors[index + 1], newSensors[index]];
    }
    setLocalSensors(newSensors);
  };

  return (
    <div className="developer-panel">
      <div className="panel-header">
        <h2 className="panel-title">⚙️ Панель розробника</h2>
        <p className="panel-subtitle">Налаштування підключення до Google Sheets та конфігурація датчиків</p>
      </div>

      <div className="panel-content">
        {/* Ліва колонка - налаштування */}
        <div className="settings-column">
          <form onSubmit={handleSubmit} className="developer-form">
            {/* Налаштування підключення */}
            <div className="config-section">
              <h3 className="section-title">🔗 Підключення до Google Sheets</h3>
              
              <div className="form-group">
                <label className="form-label">
                  📎 ID таблиці Google Sheets
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={localConfig.sheetId}
                  onChange={(e) => handleConfigChange('sheetId', e.target.value)}
                  placeholder="1DcLfPMBDavVdnaqRgT5XQFmWDcOCtnWrVmpSRD7EEa4"
                  className="form-input"
                  required
                />
                <div className="form-hint">
                  ID знаходиться між /d/ та /edit в URL таблиці
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">📊 Назва листа</label>
                  <input
                    type="text"
                    value={localConfig.sheetName}
                    onChange={(e) => handleConfigChange('sheetName', e.target.value)}
                    placeholder="AppSheetView"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">📏 Діапазон даних</label>
                  <input
                    type="text"
                    value={localConfig.range}
                    onChange={(e) => handleConfigChange('range', e.target.value)}
                    placeholder="A:Z"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Налаштування датчиків */}
            <div className="sensors-section">
              <div className="section-header">
                <h3 className="section-title">📊 Конфігурація датчиків</h3>
                <div className="available-info">
                  <span className="info-badge">Доступні колонки: {availableColumns.length}</span>
                </div>
              </div>

              <div className="sensors-list">
                {localSensors.map((sensor, index) => (
                  <div key={index} className="sensor-config-card">
                    <div className="sensor-header">
                      <div className="sensor-number">#{index + 1}</div>
                      <h4 className="sensor-title">{sensor.name || 'Новий датчик'}</h4>
                      <div className="sensor-actions">
                        <button 
                          type="button" 
                          onClick={() => moveSensor(index, 'up')}
                          disabled={index === 0}
                          className="btn btn-icon"
                          title="Перемістити вгору"
                        >
                          ⬆️
                        </button>
                        <button 
                          type="button" 
                          onClick={() => moveSensor(index, 'down')}
                          disabled={index === localSensors.length - 1}
                          className="btn btn-icon"
                          title="Перемістити вниз"
                        >
                          ⬇️
                        </button>
                        <button 
                          type="button" 
                          onClick={() => removeSensor(index)}
                          className="btn btn-icon btn-danger"
                          title="Видалити датчик"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="sensor-fields">
                      <div className="form-group">
                        <label className="form-label">Назва датчика</label>
                        <input
                          type="text"
                          value={sensor.name}
                          onChange={(e) => handleSensorChange(index, 'name', e.target.value)}
                          placeholder="Температура, Вологість, Тиск..."
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Колонка даних</label>
                        <select
                          value={sensor.column}
                          onChange={(e) => handleSensorChange(index, 'column', e.target.value)}
                          className="form-input"
                        >
                          <option value="">-- Оберіть колонку --</option>
                          {availableColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Колір на графіку</label>
                        <div className="color-input-group">
                          <input
                            type="color"
                            value={sensor.color}
                            onChange={(e) => handleSensorChange(index, 'color', e.target.value)}
                            className="color-input"
                          />
                          <span className="color-value">{sensor.color}</span>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Тип графіка</label>
                        <select
                          value={sensor.type || 'line'}
                          onChange={(e) => handleSensorChange(index, 'type', e.target.value)}
                          className="form-input"
                        >
                          <option value="line">Лінія</option>
                          <option value="bar">Стовпчик</option>
                          <option value="area">Область</option>
                        </select>
                      </div>
                      
                      <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={sensor.visible !== false}
                            onChange={(e) => handleSensorChange(index, 'visible', e.target.checked)}
                            className="checkbox-input"
                          />
                          <span className="checkbox-text">Показувати на графіку</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button type="button" onClick={addSensor} className="btn btn-add-sensor">
                ➕ Додати новий датчик
              </button>
            </div>

            {/* Кнопки дій */}
            <div className="action-buttons">
              <button type="submit" className="btn btn-primary btn-large">
                💾 Зберегти конфігурацію
              </button>
              <button type="button" onClick={onRefresh} className="btn btn-secondary btn-large">
                🔄 Оновити дані
              </button>
            </div>
          </form>
        </div>

        {/* Права колонка - інформація та прев'ю */}
        <div className="info-column">
          <div className="info-card">
            <h3>📋 Інформація про дані</h3>
            <div className="info-stats">
              <div className="stat-item">
                <span className="stat-label">Завантажено рядків:</span>
                <span className="stat-value">{data?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Датчиків налаштовано:</span>
                <span className="stat-value">{localSensors.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Доступні колонки:</span>
                <span className="stat-value">{availableColumns.length}</span>
              </div>
            </div>
            
            {availableColumns.length > 0 && (
              <div className="columns-list">
                <h4>Доступні колонки:</h4>
                <div className="columns-grid">
                  {availableColumns.map((col, index) => (
                    <span key={col} className="column-tag">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {previewData.length > 0 && (
            <div className="preview-card">
              <h3>👀 Попередній перегляд даних</h3>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(previewData[0]).map(key => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        {Object.keys(previewData[0]).map(key => (
                          <td key={key}>{row[key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.length > 5 && (
                <div className="preview-more">
                  ... і ще {data.length - 5} рядків
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperPanel;