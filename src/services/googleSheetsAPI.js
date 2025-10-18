// Додай цю функцію в кінець файлу, перед останнім export
export const getAvailableColumns = (data) => {
  if (!data || data.length === 0) return [];
  
  const columns = Object.keys(data[0]);
  // Виключаємо типові колонки з датами
  const excludeColumns = ['ДатаЧас', 'Date', 'Timestamp', 'date', 'timestamp'];
  const dataColumns = columns.filter(col => 
    !excludeColumns.includes(col) && 
    col !== '' && 
    col !== undefined
  );
  
  return dataColumns;
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