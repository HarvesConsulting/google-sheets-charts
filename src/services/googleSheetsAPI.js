import axios from 'axios';

const GOOGLE_SHEETS_BASE_URL = 'https://docs.google.com/spreadsheets/d';

// Функція для обходу CORS через proxy
const createProxyUrl = (url) => {
  return `https://cors-anywhere.herokuapp.com/${url}`;
};

export const getSheetData = async (sheetId, sheetName = 'Sheet1', range = 'A:Z') => {
  try {
    const url = `${GOOGLE_SHEETS_BASE_URL}/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}&range=${range}`;
    console.log('Отримую дані з URL:', url);
    
    // Використовуємо proxy для уникнення CORS помилок
    const proxyUrl = createProxyUrl(url);
    const response = await axios.get(proxyUrl, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    // Парсимо дані з Google Sheets
    const jsonData = JSON.parse(response.data.substring(47).slice(0, -2));
    return parseGoogleSheetsData(jsonData);
  } catch (error) {
    console.error('Помилка завантаження даних:', error);
    
    // Спробуємо без proxy якщо з proxy помилка
    try {
      const url = `${GOOGLE_SHEETS_BASE_URL}/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}&range=${range}`;
      const response = await axios.get(url);
      const jsonData = JSON.parse(response.data.substring(47).slice(0, -2));
      return parseGoogleSheetsData(jsonData);
    } catch (fallbackError) {
      throw new Error('Не вдалося отримати дані з Google Sheets');
    }
  }
};

const parseGoogleSheetsData = (data) => {
  if (!data.table || !data.table.rows) {
    console.log('Немає даних у таблиці');
    return [];
  }
  
  // Отримуємо назви колонок (перший рядок)
  const headers = data.table.cols.map(col => col.label);
  
  // Перетворюємо рядки в об'єкти
  const result = data.table.rows.map((row, index) => {
    const rowObject = {};
    
    if (row.c) {
      row.c.forEach((cell, cellIndex) => {
        const header = headers[cellIndex] || `column${cellIndex}`;
        rowObject[header] = cell ? cell.v : '';
      });
    }
    
    return rowObject;
  });
  
  console.log('Оброблені дані:', result);
  return result;
};