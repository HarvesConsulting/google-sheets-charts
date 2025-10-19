import React, { useState } from 'react';
import './StartScreen.css';

const StartScreen = ({ onDeveloperMode, onUserMode, hasSavedConfig }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUserModeClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Імітація завантаження даних
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      onUserMode();
    } catch (error) {
      console.error('Помилка завантаження:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="start-screen">
      <div className="mode-buttons">
        <button onClick={onDeveloperMode} className="btn btn-primary">
          ⚙️ Налаштування
        </button>
        
        <button 
          onClick={handleUserModeClick} 
          className={`btn btn-secondary ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner"></div>
              Завантаження...
            </>
          ) : (
            '📊 Графіки'
          )}
        </button>
      </div>
    </div>
  );
};

export default StartScreen;