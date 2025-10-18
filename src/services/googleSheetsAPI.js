import axios from 'axios';

const GOOGLE_SHEETS_BASE_URL = 'https://docs.google.com/spreadsheets/d';

// Основна функція для отримання даних з Google Sheets
export const getSheetData = async (sheetId, sheetName = 'Sheet1', range = 'A:Z') => {
  try {
    if (!sheetId) {
      throw new Error('ID таблиці не вказано');
    }

    const url = `${GOOGLE_SHEETS_BASE_URL}/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}&range=${range}`;
    console.log('Отримую дані з URL:', url);
    
    const response = await axios.get(url);
    
    if (!response.data) {
      throw new Error('Пуста відповідь від сервера');
    }
    
    // Парсимо дані з Google Sheets
    const jsonData = JSON.parse(response.data.substring(47).slice(0, -2));
    return parseGoogleSheetsData(jsonData);
  } catch (error) {
    console.error('Помилка завантаження даних:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Таблицю не знайдено. Перевірте ID та доступ.');
    } else if (error.response?.status === 403) {
      throw new Error('Доступ заборонено. Перевірте публікацію таблиці.');
    } else {
      throw new Error('Не вдалося отримати дані: ' + error.message);
    }
  }
};

// Функція для парсингу даних з Google Sheets
const parseGoogleSheetsData = (data) => {
  if (!data.table || !data.table.rows) {
    console.log('Немає даних у таблиці');
    return [];
  }
  
  // Отримуємо назви колонок (перший рядок)
  const headers = data.table.cols.map(col => col.label);
  console.log('Заголовки колонок:', headers);
  
  // Перетворюємо рядки в об'єкти
  const result = data.table.rows.map((row, index) => {
    const rowObject = {};
    
    if (row.c) {
      row.c.forEach((cell, cellIndex) => {
        const header = headers[cellIndex] || `column${cellIndex}`;
        // Обробляємо різні типи даних
        if (cell && cell.v !== undefined && cell.v !== null) {
          // Якщо число - конвертуємо в число, інакше залишаємо як є
          if (typeof cell.v === 'number' || !isNaN(parseFloat(cell.v))) {
            rowObject[header] = parseFloat(cell.v);
          } else {
            rowObject[header] = cell.v.toString();
          }
        } else {
          rowObject[header] = ''; // Порожні комірки
        }
      });
    }
    
    return rowObject;
  });
  
  console.log('Оброблені дані:', result);
  return result;
};

// Функція для отримання списку доступних колонок - ВИПРАВЛЕНА ВЕРСІЯ
export const getAvailableColumns = (data) => {
  if (!data || data.length === 0) return [];
  
  const columns = Object.keys(data[0]);
  console.log('Всі колонки з даних:', columns);
  
  // Фільтруємо тільки порожні та undefined значення
  const availableColumns = columns.filter(col => 
    col !== '' && 
    col !== undefined &&
    col !== null
  );
  
  console.log('Доступні колонки після фільтрації:', availableColumns);
  return availableColumns;
};

// Функція для фільтрації та очищення даних для конкретного датчика
export const cleanSensorData = (data, dateColumn, sensorColumn) => {
  if (!data || !Array.isArray(data)) return [];
  
  return data
    .filter(row => {
      const hasDate = row[dateColumn] !== undefined && row[dateColumn] !== '' && row[dateColumn] !== null;
      const hasSensorData = row[sensorColumn] !== undefined && row[sensorColumn] !== '' && row[sensorColumn] !== null;
      const isSensorNumber = !isNaN(parseFloat(row[sensorColumn]));
      
      return hasDate && hasSensorData && isSensorNumber;
    })
    .map(row => ({
      date: row[dateColumn],
      value: parseFloat(row[sensorColumn]),
      sensor: sensorColumn
    }));
};