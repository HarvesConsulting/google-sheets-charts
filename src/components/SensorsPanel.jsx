// SensorsPanel.jsx
import React from 'react';

const SensorsPanel = ({ sensors, visibleSensors, onToggleSensor, onBack }) => {
  return (
    <div className="controls-panel sensors-panel open">
      <div className="panel-header">
        <button className="back-button" onClick={onBack}>← Назад</button>
        <h3>Датчики</h3>
      </div>
      <div className="controls-group">
        <label>Вибір датчиків:</label>
        <div className="sensors-list">
          {sensors.map(sensor => (
            <label key={sensor.column} className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleSensors[sensor.column] !== false}
                onChange={(e) => onToggleSensor(sensor.column, e.target.checked)}
              />
              <span
                className="sensor-color"
                style={{ backgroundColor: sensor.color || '#1e3a8a' }}
              ></span>
              <span className="sensor-name">{sensor.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SensorsPanel);
