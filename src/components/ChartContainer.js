import React from 'react';

const ChartContainer = ({ data, config, sensors }) => {
  // Тепер ChartContainer використовується тільки в режимі розробника
  // для попереднього перегляду даних
  
  if (!data || data.length === 0) {
    return (
      <div className="data-preview">
        <h3>📋 Попередній перегляд даних</h3>
        <div className="no-data">Немає даних для перегляду</div>
      </div>
    );
  }

  return (
    <div className="data-preview">
      <h3>📋 Попередній перегляд даних</h3>
      <div className="preview-info">
        <p>Загальна кількість рядків: <strong>{data.length}</strong></p>
        <p>Доступні колонки: <strong>{Object.keys(data[0]).join(', ')}</strong></p>
      </div>
      <div className="preview-table">
        <table>
          <thead>
            <tr>
              {Object.keys(data[0]).map(key => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, index) => (
              <tr key={index}>
                {Object.keys(data[0]).map(key => (
                  <td key={key}>{row[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 10 && (
          <div className="preview-more">
            ... і ще {data.length - 10} рядків
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartContainer;