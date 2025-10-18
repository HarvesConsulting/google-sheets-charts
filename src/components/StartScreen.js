import React from 'react';
import './StartScreen.css';

const StartScreen = ({ onDeveloperMode, onUserMode, hasSavedConfig }) => {
  return (
    <div className="start-screen">
      
      
      <div className="mode-buttons">
        <button onClick={onDeveloperMode} className="btn btn-primary">
          ⚙️ Налаштування
        </button>
        
        <button onClick={onUserMode} className="btn btn-secondary">
          📊 Графіки
        </button>
      </div>

      
    </div>
  );
};

export default StartScreen;