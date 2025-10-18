import axios from 'axios';

const GOOGLE_SHEETS_BASE_URL = 'https://docs.google.com/spreadsheets/d';

export const getSheetData = async (sheetId, sheetName = 'Sheet1', range = 'A:Z') => {
  try {
    const url = `${GOOGLE_SHEETS_BASE_URL}/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}&range=${range}`;
    console.log('Отримую дані з URL:', url);
    
    const response = await axios.get(url);
    
    // Парсимо дані з Google Sheets
    const jsonData = JSON.parse(response.data.substring(47).slice(0, -2));
    return parseGoogleSheetsData(jsonData);
  } catch (error) {
    console.error('Помилка завантаження даних:', error);
    throw error;
  }
};

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

// Нова функція для фільтрації та очищення даних
export const cleanChartData = (data, xAxis, yAxis) => {
  if (!data || !Array.isArray(data)) return [];
  
  return data
    .filter(row => {
      // Фільтруємо рядки де є дані для обох осей
      const hasXData = row[xAxis] !== undefined && row[xAxis] !== '' && row[xAxis] !== null;
      const hasYData = row[yAxis] !== undefined && row[yAxis] !== '' && row[yAxis] !== null;
      
      // Додатково перевіряємо що Y - число
      const isYNumber = !isNaN(parseFloat(row[yAxis]));
      
      return hasXData && hasYData && isYNumber;
    })
    .map(row => ({
      ...row,
      // Конвертуємо Y в число на всяк випадок
      [yAxis]: parseFloat(row[yAxis])
    }));
};