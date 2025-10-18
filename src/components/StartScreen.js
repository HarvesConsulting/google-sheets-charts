import React from 'react';
import './StartScreen.css';

const StartScreen = ({ onDeveloperMode, onUserMode }) => {
  return (
    <div className="start-screen">
      <div className="welcome-card">
        <div className="welcome-header">
          <h2>📊 Ласкаво просимо!</h2>
          <p>Оберіть режим роботи з графіками</p>
        </div>
        
        <div className="mode-cards">
          <div className="mode-card developer-card">
            <div className="mode-icon">👨‍💻</div>
            <h3>Режим розробника</h3>
            <p>Налаштування підключення до Google Sheets, вибір даних для графіка</p>
            <ul>
              <li>📎 Введення ID таблиці</li>
              <li>📈 Вибір осей X та Y</li>
              <li>⚙️ Налаштування параметрів</li>
            </ul>
            <button onClick={onDeveloperMode} className="btn btn-primary">
              Увійти в режим розробника
            </button>
          </div>
          
          <div className="mode-card user-card">
            <div className="mode-icon">👤</div>
            <h3>Режим перегляду</h3>
            <p>Перегляд готових графіків без налаштувань</p>
            <ul>
              <li>📊 Готові графіки</li>
              <li>📈 Лінійні діаграми</li>
              <li>📱 Простий інтерфейс</li>
            </ul>
            <button onClick={onUserMode} className="btn btn-secondary">
              Увійти в режим перегляду
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;