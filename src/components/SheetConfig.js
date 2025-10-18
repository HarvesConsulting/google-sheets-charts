import React, { useState } from 'react';

const SheetConfig = ({ config, onConfigUpdate, onRefresh }) => {
  const [localConfig, setLocalConfig] = useState(config);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfigUpdate(localConfig);
  };

  const handleChange = (field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="sheet-config">
      <h3>⚙️ Налаштування Google Tables</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>🔑 ID таблиці:</label>
          <input
            type="text"
            value={localConfig.sheetId}
            onChange={(e) => handleChange('sheetId', e.target.value)}
            placeholder="Введіть ID з URL Google Sheets"
            className="form-input"
          />
          <small>ID знаходиться між /d/ та /edit в URL</small>
        </div>
        
        <div className="form-group">
          <label>📊 Назва листа:</label>
          <input
            type="text"
            value={localConfig.sheetName}
            onChange={(e) => handleChange('sheetName', e.target.value)}
            placeholder="Sheet1"
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label>📍 Діапазон даних:</label>
          <input
            type="text"
            value={localConfig.range}
            onChange={(e) => handleChange('range', e.target.value)}
            placeholder="A:Z"
            className="form-input"
          />
          <small>Наприклад: A:B для двох колонок</small>
        </div>
        
        <div className="form-group">
          <label>📈 Ось X (назва колонки):</label>
          <input
            type="text"
            value={localConfig.xAxis}
            onChange={(e) => handleChange('xAxis', e.target.value)}
            placeholder="Favorite"
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label>📉 Ось Y (назва колонки):</label>
          <input
            type="text"
            value={localConfig.yAxis}
            onChange={(e) => handleChange('yAxis', e.target.value)}
            placeholder="Count"
            className="form-input"
          />
        </div>
        
        <div className="buttons">
          <button type="submit" className="btn btn-primary">💾 Застосувати</button>
          <button type="button" onClick={onRefresh} className="btn btn-secondary">🔄 Оновити</button>
        </div>
      </form>
    </div>
  );
};

export default SheetConfig;