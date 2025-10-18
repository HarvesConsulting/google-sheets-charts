import React, { useState, useEffect } from 'react';
import { getAvailableColumns } from '../services/googleSheetsAPI';
import './DeveloperMode.css';

const DeveloperMode = ({ 
  config, 
  data, 
  loading, 
  error, 
  sensors,
  onConfigUpdate, 
  onSensorsUpdate,
  onFetchData,
  onEnterUserMode,
  onSaveConfig,
  onClearConfig
}) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [localSensors, setLocalSensors] = useState(sensors || []);
  const [availableColumns, setAvailableColumns] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      const columns = getAvailableColumns(data);
      setAvailableColumns(columns);
      console.log('📊 Доступні колонки для вибору:', columns);
    }
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfigUpdate(localConfig);
    onSensorsUpdate(localSensors);
  };

  const handleFetchData = () => {
    onConfigUpdate(localConfig);
    onSensorsUpdate(localSensors);
    setTimeout(() => {
      onFetchData(localConfig.sheetId);
    }, 100);
  };

  const handleConfigChange = (field, value) => {
    const newConfig = {
      ...localConfig,
      [field]: value
    };
    setLocalConfig(newConfig);
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
    const availableForSensors = availableColumns.filter(col => 
      col !== localConfig.xAxis && 
      !localSensors.some(sensor => sensor.column === col)
    );

    if (availableForSensors.length === 0) {
      alert('⚠️ Всі доступні колонки вже додані як датчики');
      return;
    }

    const newSensor = {
      name: `Датчик ${localSensors.length + 1}`,
      column: availableForSensors[0],
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      visible: true,
      type: 'line'
    };
    setLocalSensors(prev => [...prev, newSensor]);
  };

  const removeSensor = (index) => {
    setLocalSensors(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid = localConfig.sheetId && localConfig.xAxis && localSensors.length > 0;
  const hasData = data.length > 0;

  return (
    <div className="developer-mode">
      <div className="developer-content">
        <div className="config-panel">
          <form onSubmit={handleSubmit} className="config-form">
            
            {/* Секція підключення */}
            <div className="form-section">
              <h3>🔗 Підключення до даних</h3>
              
              <div className="form-group">
                <label>📎 ID Google Sheets таблиці *</label>
                <input
                  type="text"
                  value={localConfig.sheetId}
                  onChange={(e) => handleConfigChange('sheetId', e.target.value)}
                  placeholder="1DcLfPMBDavVdnaqRgT5XQFmWDcOCtnWrVmpSRD7EEa4"
                  className="form-input"
                />
                <small>ID знаходиться між /d/ та /edit в URL вашої таблиці</small>
              </div>

              <button 
                type="button" 
                onClick={handleFetchData}
                disabled={!localConfig.sheetId || loading}
                className="btn btn-primary btn-load-data"
              >
                {loading ? '🔄 Завантаження...' : '📥 Завантажити дані з таблиці'}
              </button>
            </div>

            {/* Секція вибору даних */}
            {hasData && (
              <>
                <div className="form-section">
                  <h3>📊 Вибір даних для графіка</h3>
                  
                  <div className="data-selection-info">
                    <div className="info-card">
                      <span className="info-badge">📋 Завантажено рядків: {data.length}</span>
                      <span className="info-badge">📊 Доступно колонок: {availableColumns.length}</span>
                      <span className="info-badge">📈 Додано датчиків: {localSensors.length}</span>
                    </div>
                    
                    {availableColumns.length > 0 && (
                      <div className="columns-preview">
                        <h4>Доступні колонки:</h4>
                        <div className="columns-tags">
                          {availableColumns.map(col => (
                            <span 
                              key={col} 
                              className={`column-tag ${
                                col === localConfig.xAxis ? 'column-tag-x' : 
                                localSensors.some(s => s.column === col) ? 'column-tag-y' : ''
                              }`}
                            >
                              {col}
                              {col === localConfig.xAxis && ' (X)'}
                              {localSensors.some(s => s.column === col) && ' (Y)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>📈 Вісь X (незалежна змінна) *</label>
                    <select
                      value={localConfig.xAxis}
                      onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                      className="form-input"
                    >
                      <option value="">-- Оберіть колонку для осі X --</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <small>Час, дата або інша незалежна змінна</small>
                  </div>
                </div>

                {/* Секція датчиків */}
                <div className="form-section">
                  <div className="section-header">
                    <h3>📈 Керування датчиками (Вісь Y)</h3>
                    <button 
                      type="button" 
                      onClick={addSensor}
                      className="btn btn-success btn-add-sensor"
                    >
                      ➕ Додати датчик
                    </button>
                  </div>

                  {localSensors.length === 0 ? (
                    <div className="no-sensors">
                      <p>🎯 Ще не додано жодного датчика. Натисніть "Додати датчик" щоб почати.</p>
                    </div>
                  ) : (
                    <div className="sensors-list">
                      {localSensors.map((sensor, index) => (
                        <div key={index} className="sensor-card">
                          <div className="sensor-header">
                            <div className="sensor-number">#{index + 1}</div>
                            <h4>{sensor.name}</h4>
                            <button 
                              type="button" 
                              onClick={() => removeSensor(index)}
                              className="btn btn-danger btn-small"
                            >
                              🗑️
                            </button>
                          </div>
                          
                          <div className="sensor-fields">
                            <div className="form-group">
                              <label>Назва датчика</label>
                              <input
                                type="text"
                                value={sensor.name}
                                onChange={(e) => handleSensorChange(index, 'name', e.target.value)}
                                placeholder="Назва датчика..."
                                className="form-input"
                              />
                            </div>
                            
                            <div className="form-group">
                              <label>Колонка даних *</label>
                              <select
                                value={sensor.column}
                                onChange={(e) => handleSensorChange(index, 'column', e.target.value)}
                                className="form-input"
                              >
                                <option value="">-- Оберіть колонку --</option>
                                {availableColumns
                                  .filter(col => col !== localConfig.xAxis)
                                  .map(col => (
                                    <option key={col} value={col}>{col}</option>
                                  ))
                                }
                              </select>
                            </div>
                            
                            <div className="form-group">
                              <label>Колір лінії</label>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <div className="form-group">
                    <label>🏷️ Назва графіка</label>
                    <input
                      type="text"
                      value={localConfig.chartTitle}
                      onChange={(e) => handleConfigChange('chartTitle', e.target.value)}
                      placeholder="Графік залежності..."
                      className="form-input"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Кнопки дій */}
            <div className="action-buttons">
              <button 
                type="button" 
                onClick={() => {
                  onConfigUpdate(localConfig);
                  onSensorsUpdate(localSensors);
                  onSaveConfig();
                }}
                disabled={!isFormValid}
                className="btn btn-success"
              >
                💾 Зберегти конфігурацію
              </button>
              
              <button 
                type="button" 
                onClick={onClearConfig}
                className="btn btn-warning"
              >
                🗑️ Очистити налаштування
              </button>
              
              {hasData && (
                <button 
                  type="button" 
                  onClick={onEnterUserMode}
                  disabled={!isFormValid}
                  className="btn btn-secondary"
                >
                  📊 Перейти до графіків ({localSensors.length} датчик{localSensors.length !== 1 ? 'ів' : ''})
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Попередній перегляд даних */}
          {hasData && (
            <div className="data-preview-section">
              <h4>👀 Попередній перегляд даних</h4>
              <div className="preview-info">
                <p>Відображаються перші 8 рядків з {data.length} завантажених</p>
              </div>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {availableColumns.map(col => (
                        <th 
                          key={col} 
                          className={
                            col === localConfig.xAxis ? 'column-x' :
                            localSensors.some(s => s.column === col) ? 'column-y' : ''
                          }
                        >
                          {col}
                          {col === localConfig.xAxis && ' (X)'}
                          {localSensors.some(s => s.column === col) && ' (Y)'}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 8).map((row, index) => (
                      <tr key={index}>
                        {availableColumns.map(col => (
                          <td 
                            key={col}
                            className={
                              col === localConfig.xAxis ? 'column-x' :
                              localSensors.some(s => s.column === col) ? 'column-y' : ''
                            }
                          >
                            {row[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 8 && (
                  <div className="preview-more">
                    ... і ще {data.length - 8} рядків
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperMode;