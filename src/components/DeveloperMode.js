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
  onSaveConfig
}) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [availableColumns, setAvailableColumns] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      const columns = getAvailableColumns(data);
      setAvailableColumns(columns);
      
      // Автоматично вибираємо перші доступні колонки, якщо не вибрані
      if (!localConfig.xAxis && columns.length > 0) {
        const newConfig = { ...localConfig };
        if (!newConfig.xAxis) newConfig.xAxis = columns[0];
        if (!newConfig.yAxis && columns.length > 1) newConfig.yAxis = columns[1];
        setLocalConfig(newConfig);
        onConfigUpdate(newConfig);
      }
    }
  }, [data, localConfig, onConfigUpdate]);

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
        <h2>👨‍💻 Режим розробника</h2>
        <p>Налаштуйте підключення до Google Sheets та виберіть дані для графіка</p>
      </div>

      <div className="developer-content">
        <div className="config-panel">
          <form onSubmit={handleSubmit} className="config-form">
            <div className="form-section">
              <h3>🔗 Підключення до Google Sheets</h3>
              
              <div className="form-group">
                <label>📎 ID таблиці Google Sheets *</label>
                <input
                  type="text"
                  value={localConfig.sheetId}
                  onChange={(e) => handleConfigChange('sheetId', e.target.value)}
                  placeholder="1DcLfPMBDavVdnaqRgT5XQFmWDcOCtnWrVmpSRD7EEa4"
                  className="form-input"
                />
                <small>ID знаходиться між /d/ та /edit в URL таблиці</small>
              </div>

              <button 
                type="button" 
                onClick={handleFetchData}
                disabled={!localConfig.sheetId || loading}
                className="btn btn-primary btn-load-data"
              >
                {loading ? '🔄 Завантаження...' : '📥 Завантажити таблицю'}
              </button>
            </div>

            {hasData && (
              <div className="form-section">
                <h3>📐 Вибір даних для графіка</h3>
                
                <div className="columns-info">
                  <span className="info-badge">
                    📋 Доступно колонок: {availableColumns.length}
                  </span>
                </div>
                
                <div className="form-group">
                  <label>📈 Вісь X (дата/час) *</label>
                  <select
                    value={localConfig.xAxis}
                    onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                    className="form-input"
                    disabled={!hasData}
                  >
                    <option value="">-- Оберіть колонку --</option>
                    {availableColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <small>Колонка з датами та часом для горизонтальної осі</small>
                </div>

                <div className="form-group">
                  <label>📉 Вісь Y (значення) *</label>
                  <select
                    value={localConfig.yAxis}
                    onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                    className="form-input"
                    disabled={!hasData}
                  >
                    <option value="">-- Оберіть колонку --</option>
                    {availableColumns
                      .filter(col => col !== localConfig.xAxis)
                      .map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))
                    }
                  </select>
                  <small>Колонка з числовими даними для вертикальної осі</small>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button 
                type="button" 
                onClick={onSaveConfig}
                disabled={!isFormValid}
                className="btn btn-success"
              >
                💾 Запам'ятати таблицю
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

          {hasData && (
            <div className="data-preview">
              <h4>📋 Попередній перегляд даних ({data.length} рядків)</h4>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      <th className="axis-x">{localConfig.xAxis}</th>
                      <th className="axis-y">{localConfig.yAxis}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        <td>{row[localConfig.xAxis]}</td>
                        <td>{row[localConfig.yAxis]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 5 && (
                  <div className="preview-more">
                    ... і ще {data.length - 5} рядків
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