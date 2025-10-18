import React, { useState, useEffect } from 'react';
import { getAvailableColumns } from '../services/googleSheetsAPI';

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
  const [localSensors, setLocalSensors] = useState(sensors);

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
      { name: '', column: '', color: '#0088FE', visible: true }
    ]);
  };

  const removeSensor = (index) => {
    setLocalSensors(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="developer-panel">
      <h2>⚙️ Панель розробника</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="config-section">
          <h3>📋 Налаштування таблиці</h3>
          
          <div className="form-group">
            <label>🔑 ID таблиці:</label>
            <input
              type="text"
              value={localConfig.sheetId}
              onChange={(e) => handleConfigChange('sheetId', e.target.value)}
              placeholder="Введіть ID з URL Google Sheets"
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label>📊 Назва листа:</label>
            <input
              type="text"
              value={localConfig.sheetName}
              onChange={(e) => handleConfigChange('sheetName', e.target.value)}
              placeholder="AppSheetView"
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label>📍 Колонка з датою:</label>
            <select
              value={localConfig.dateColumn}
              onChange={(e) => handleConfigChange('dateColumn', e.target.value)}
              className="form-input"
            >
              <option value="ДатаЧас">ДатаЧас</option>
              <option value="Date">Date</option>
              <option value="Timestamp">Timestamp</option>
            </select>
          </div>
        </div>

        <div className="sensors-section">
          <h3>📊 Налаштування датчиків</h3>
          <p>Доступні колонки: {availableColumns.join(', ') || '---'}</p>
          
          {localSensors.map((sensor, index) => (
            <div key={index} className="sensor-config">
              <div className="sensor-header">
                <h4>Датчик {index + 1}</h4>
                <button 
                  type="button" 
                  onClick={() => removeSensor(index)}
                  className="btn btn-danger"
                >
                  🗑️ Видалити
                </button>
              </div>
              
              <div className="sensor-fields">
                <div className="form-group">
                  <label>Назва датчика:</label>
                  <input
                    type="text"
                    value={sensor.name}
                    onChange={(e) => handleSensorChange(index, 'name', e.target.value)}
                    placeholder="Наприклад: Температура"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Колонка в таблиці:</label>
                  <select
                    value={sensor.column}
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
                  <label>Колір на графіку:</label>
                  <input
                    type="color"
                    value={sensor.color}
                    onChange={(e) => handleSensorChange(index, 'color', e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={sensor.visible}
                      onChange={(e) => handleSensorChange(index, 'visible', e.target.checked)}
                    />
                    Показувати на графіку
                  </label>
                </div>
              </div>
            </div>
          ))}
          
          <button type="button" onClick={addSensor} className="btn btn-secondary">
            ➕ Додати датчик
          </button>
        </div>

        <div className="buttons">
          <button type="submit" className="btn btn-primary">💾 Зберегти налаштування</button>
          <button type="button" onClick={onRefresh} className="btn btn-secondary">🔄 Оновити дані</button>
        </div>
      </form>
    </div>
  );
};

export default DeveloperPanel;