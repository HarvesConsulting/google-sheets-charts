// PeriodPanel.jsx
import React from 'react';

const PeriodPanel = ({ timeRange, onSetTimeRange, onBack }) => {
  return (
    <div className="controls-panel period-panel open">
      <div className="panel-header">
        <button className="back-button" onClick={onBack}>← Назад</button>
        <h3>Період даних</h3>
      </div>
      <div className="controls-group">
        <div className="time-buttons">
          <button
            className={`time-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => onSetTimeRange('all')}
          >
            Весь період
          </button>
          <button
            className={`time-btn ${timeRange === '7d' ? 'active' : ''}`}
            onClick={() => onSetTimeRange('7d')}
          >
            7 днів
          </button>
          <button
            className={`time-btn ${timeRange === '1d' ? 'active' : ''}`}
            onClick={() => onSetTimeRange('1d')}
          >
            Добу
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PeriodPanel);
