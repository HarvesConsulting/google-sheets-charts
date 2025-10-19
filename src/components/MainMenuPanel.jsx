// MainMenuPanel.jsx
import React from 'react';

const MainMenuPanel = ({ onOpenPeriod, onOpenSensors, onBackToSettings, onBackToHome }) => {
  return (
    <div className="controls-panel main-menu-panel open">
      <div className="controls-group">
        <label>Управління:</label>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={onOpenPeriod}>
            <span className="menu-icon">📅</span>
            <span className="menu-text">Період даних</span>
          </button>

          <button className="menu-btn" onClick={onOpenSensors}>
            <span className="menu-icon">📊</span>
            <span className="menu-text">Датчики</span>
          </button>

          <button className="menu-btn" onClick={onBackToSettings}>
            <span className="menu-icon">⚙️</span>
            <span className="menu-text">Налаштування</span>
          </button>

          <button className="menu-btn" onClick={onBackToHome}>
            <span className="menu-icon">🏠</span>
            <span className="menu-text">На головну</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MainMenuPanel);
