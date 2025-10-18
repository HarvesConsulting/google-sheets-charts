import React, { useState, useEffect } from 'react';
import { getAvailableColumns } from '../services/googleSheetsAPI';
import './DeveloperMode.css';

const DeveloperMode = ({ 
  config, 
  data, 
  loading, 
  error, 
  onConfigUpdate, 
  onFetchData,
  onEnterUserMode,
  onSaveConfig,
  onClearConfig
}) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [availableColumns, setAvailableColumns] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      const columns = getAvailableColumns(data);
      setAvailableColumns(columns);
    }
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfigUpdate(localConfig);
  };

  const handleFetchData = () => {
    onConfigUpdate(localConfig);
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
    onConfigUpdate(newConfig);
  };

  const isFormValid = localConfig.sheetId && localConfig.xAxis && localConfig.yAxis;
  const hasData = data.length > 0;

  return (
    <div className="developer-mode">
      <div className="mode-header">
        <h2>👨‍💻 Режим налаштування</h2>
        <p>Налаштуйте підключення до Google Sheets та конфігуруйте графік</p>
      </div>

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
              <div className="form-section">
                <h3>📊 Вибір даних для графіка</h3>
                
                <div className="data-selection-info">
                  <div className="info-card">
                    <span className="info-badge">📋 Завантажено рядків: {data.length}</span>
                    <span className="info-badge">📊 Доступно колонок: {availableColumns.length}</span>
                  </div>
                </div>

                <div className="columns-grid">
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

                  <div className="form-group">
                    <label>📉 Вісь Y (залежна змінна) *</label>
                    <select
                      value={localConfig.yAxis}
                      onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                      className="form-input"
                    >
                      <option value="">-- Оберіть колонку для осі Y --</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <small>Числові значення, що відображаються на графіку</small>
                  </div>
                </div>

                <div className="columns-grid">
                  <div className="form-group">
                    <label>🏷️ Назва графіка</label>
                    <input
                      type="text"
                      value={localConfig.chartTitle}
                      onChange={(e) => handleConfigChange('chartTitle', e.target.value)}
                      placeholder="Графік залежності..."
                      className="form-input"
                    />
                    <small>Заголовок, що відображатиметься над графіком</small>
                  </div>

                  <div className="form-group">
                    <label>🏷️ Підпис осі Y</label>
                    <input
                      type="text"
                      value={localConfig.yAxisLabel}
                      onChange={(e) => handleConfigChange('yAxisLabel', e.target.value)}
                      placeholder="Значення"
                      className="form-input"
                    />
                    <small>Підпис для вертикальної осі</small>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки дій */}
            <div className="action-buttons">
              <button 
                type="button" 
                onClick={onSaveConfig}
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
                  className="btn btn-primary"
                >
                  📊 Перейти до графіка
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
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {availableColumns.map(col => (
                        <th 
                          key={col} 
                          className={
                            col === localConfig.xAxis ? 'column-x' :
                            col === localConfig.yAxis ? 'column-y' : ''
                          }
                        >
                          {col}
                          {col === localConfig.xAxis && ' (X)'}
                          {col === localConfig.yAxis && ' (Y)'}
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
                              col === localConfig.yAxis ? 'column-y' : ''
                            }
                          >
                            {row[col]}
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