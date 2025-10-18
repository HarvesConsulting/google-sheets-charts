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