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
  const [localConfig, setLocalConfig] = useState(config);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [localSensors, setLocalSensors] = useState(sensors || []);

  useEffect(() => {
    if (data && data.length > 0) {
      const columns = getAvailableColumns(data);
      setAvailableColumns(columns);
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
    setLocalSensors(prev => [
      ...prev,
      { name: `Датчик ${prev.length + 1}`, column: '', color: '#0088FE', visible: true }
    ]);
  };

  const removeSensor = (index) => {
    setLocalSensors(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="developer-panel">
      <h2 className="panel-title">⚙️ Панель розробника</h2>
      
      <form onSubmit={handleSubmit} className="developer-form">
        {/* Секція налаштувань таблиці */}
        <div className="config-section">
          <h3 className="section-title">📋 Налаштування таблиці</h3>
          
          <div className="form-group">
            <label className="form-label">🔑 ID таблиці:</label>
            <input
              type="text"
              value={localConfig.sheetId || ''}
              onChange={(e) => handleConfigChange('sheetId', e.target.value)}
              placeholder="Введіть ID з URL Google Sheets"
              className="form-input"
            />
            <div className="form-hint">ID знаходиться між /d/ та /edit в URL</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">📊 Назва листа:</label>
              <input
                type="text"
                value={localConfig.sheetName || ''}
                onChange={(e) => handleConfigChange('sheetName', e.target.value)}
                placeholder="AppSheetView"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">📅 Колонка з датою:</label>
              <select
                value={localConfig.dateColumn || 'ДатаЧас'}
                onChange={(e) => handleConfigChange('dateColumn', e.target.value)}
                className="form-input"
              >
                <option value="ДатаЧас">ДатаЧас</option>
                <option value="Date">Date</option>
                <option value="Timestamp">Timestamp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Секція датчиків */}
        <div className="sensors-section">
          <div className="section-header">
            <h3 className="section-title">📊 Налаштування датчиків</h3>
            <div className="available-columns">
              Доступні колонки: <strong>{availableColumns.join(', ') || '---'}</strong>
            </div>
          </div>
          
          <div className="sensors-list">
            {localSensors.map((sensor, index) => (
              <div key={index} className="sensor-config-card">
                <div className="sensor-header">
                  <h4 className="sensor-title">Датчик {index + 1}</h4>
                  <button 
                    type="button" 
                    onClick={() => removeSensor(index)}
                    className="btn btn-danger btn-small"
                  >
                    🗑️ Видалити
                  </button>
                </div>
                
                <div className="sensor-fields">
                  <div className="form-group">
                    <label className="form-label">Назва датчика:</label>
                    <input
                      type="text"
                      value={sensor.name || ''}
                      onChange={(e) => handleSensorChange(index, 'name', e.target.value)}
                      placeholder="Наприклад: Температура"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Колонка в таблиці:</label>
                    <select
                      value={sensor.column || ''}
                      onChange={(e) => handleSensorChange(index, 'column', e.target.value)}
                      className="form-input"
                    >
                      <option value="">Оберіть колонку</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Колір на графіку:</label>
                    <div className="color-input-group">
                      <input
                        type="color"
                        value={sensor.color || '#0088FE'}
                        onChange={(e) => handleSensorChange(index, 'color', e.target.value)}
                        className="color-input"
                      />
                      <span className="color-value">{sensor.color}</span>
                    </div>
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
            ➕ Додати датчик
          </button>
        </div>

        {/* Кнопки дій */}
        <div className="action-buttons">
          <button type="submit" className="btn btn-primary btn-large">
            💾 Зберегти налаштування
          </button>
          <button type="button" onClick={onRefresh} className="btn btn-secondary btn-large">
            🔄 Оновити дані
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeveloperPanel;