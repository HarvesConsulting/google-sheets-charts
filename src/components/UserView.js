import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const UserView = ({ data, config, sensors, loading, error, lastUpdate }) => {
  const [chartType, setChartType] = useState('line');
  const [visibleSensors, setVisibleSensors] = useState({});

  // Ініціалізація видимості датчиків
  React.useEffect(() => {
    const initialVisibility = {};
    sensors.forEach(sensor => {
      initialVisibility[sensor.name] = sensor.visible !== false;
    });
    setVisibleSensors(initialVisibility);
  }, [sensors]);

  // Функція для конвертації дати з рядка в об'єкт Date
  const parseDate = useCallback((dateString) => {
    if (!dateString) return new Date();
    
    // Якщо це вже об'єкт Date, повертаємо його
    if (dateString instanceof Date) return dateString;
    
    // Спроба розпарсити формат "dd.mm.yyyy hh:mm:ss"
    const parts = dateString.toString().split(' ');
    if (parts.length >= 2) {
      const dateParts = parts[0].split('.');
      const timeParts = parts[1].split(':');
      
      if (dateParts.length === 3 && timeParts.length >= 2) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Місяці з 0 до 11
        const year = parseInt(dateParts[2], 10);
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
        
        return new Date(year, month, day, hours, minutes, seconds);
      }
    }
    
    // Спроба стандартного парсингу
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }, []);

  // Функція для форматування дати для відображення
  const formatDateForDisplay = useCallback((date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? parseDate(date) : date;
    
    // Формат: "dd.mm hh:mm"
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${day}.${month} ${hours}:${minutes}`;
  }, [parseDate]);

  // Підготовка даних для графіків
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    console.log('Original data sample:', data.slice(0, 3));
    
    // Створюємо масив даних з правильними датами
    const preparedData = data.map((row, index) => {
      const dateValue = row[config.dateColumn];
      const parsedDate = parseDate(dateValue);
      
      const dataPoint = {
        // Зберігаємо оригінальне значення для ключа
        date: dateValue,
        // Додаємо timestamp для сортування
        timestamp: parsedDate.getTime(),
        // Додаємо відформатовану дату для відображення
        displayDate: formatDateForDisplay(dateValue),
        // Додаємо індекс для уникнення дублікатів
        index: index
      };
      
      // Додаємо дані датчиків
      sensors.forEach(sensor => {
        if (sensor.column && visibleSensors[sensor.name] !== false) {
          const value = row[sensor.column];
          dataPoint[sensor.name] = value !== undefined && value !== null && value !== '' 
            ? parseFloat(value) 
            : null;
        }
      });
      
      return dataPoint;
    }).filter(item => item.timestamp > 0); // Фільтруємо невалідні дати
    
    // Сортуємо за датою
    const sortedData = preparedData.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log('Prepared chart data:', sortedData.slice(0, 3));
    return sortedData;
  }, [data, config.dateColumn, sensors, visibleSensors, parseDate, formatDateForDisplay]);

  // Кастомний компонент для підписів на осі X
  const CustomXAxisTick = useCallback(({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          fill="#666" 
          fontSize={10}
        >
          {formatDateForDisplay(payload.value)}
        </text>
      </g>
    );
  }, [formatDateForDisplay]);

  // Кастомний тултіп
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{`Дата: ${formatDateForDisplay(label)}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value !== null ? entry.value : 'N/A'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, [formatDateForDisplay]);

  const toggleSensorVisibility = (sensorName) => {
    setVisibleSensors(prev => ({
      ...prev,
      [sensorName]: !prev[sensorName]
    }));
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '---';
    return lastUpdate.toLocaleTimeString('uk-UA');
  };

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="no-data">
          📊 Немає даних для відображення
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 40 }
    };

    const activeSensors = sensors.filter(sensor => visibleSensors[sensor.name] !== false);

    // Налаштування для осі X в залежності від кількості точок даних
    const xAxisProps = {
      dataKey: "date",
      tick: <CustomXAxisTick />,
      interval: chartData.length > 10 ? "preserveStartEnd" : 0,
      minTickGap: 20,
      height: 60
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis {...xAxisProps} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {activeSensors.map((sensor) => (
              <Line 
                key={sensor.name}
                type="monotone" 
                dataKey={sensor.name} 
                stroke={sensor.color || '#0088FE'}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={sensor.name}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis {...xAxisProps} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {activeSensors.map((sensor) => (
              <Area 
                key={sensor.name}
                type="monotone" 
                dataKey={sensor.name} 
                stroke={sensor.color || '#0088FE'}
                fill={sensor.color || '#0088FE'}
                fillOpacity={0.3}
                name={sensor.name}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis {...xAxisProps} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {activeSensors.map((sensor) => (
              <Bar 
                key={sensor.name}
                dataKey={sensor.name} 
                fill={sensor.color || '#0088FE'}
                name={sensor.name}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        );
      
      default:
        return <div>Оберіть тип графіка</div>;
    }
  };

  if (loading) {
    return <div className="loading">Завантаження...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="user-view">
      <div className="user-header">
        <h2>📈 Моніторинг датчиків</h2>
        <div className="last-update-user">
          ⏰ Дані оновлено: {formatLastUpdate()}
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="data-info">
          <p>📊 Відображено {chartData.length} точок даних</p>
        </div>
      )}

      <div className="chart-controls-user">
        <div className="chart-type-selector">
          <label>Тип графіка:</label>
          <select 
            value={chartType} 
            onChange={(e) => setChartType(e.target.value)}
          >
            <option value="line">📈 Лінійний</option>
            <option value="area">📊 Області</option>
            <option value="bar">📊 Стовпчиковий</option>
          </select>
        </div>

        <div className="sensors-controls">
          <label>Датчики:</label>
          <div className="sensors-toggle">
            {sensors.map(sensor => (
              <label key={sensor.name} className="sensor-toggle-item">
                <input
                  type="checkbox"
                  checked={visibleSensors[sensor.name] !== false}
                  onChange={() => toggleSensorVisibility(sensor.name)}
                />
                <span 
                  className="sensor-color-indicator"
                  style={{ backgroundColor: sensor.color || '#0088FE' }}
                ></span>
                {sensor.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-wrapper-user">
        <ResponsiveContainer width="100%" height={400}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Додатковий дебаг інформація */}
      {chartData.length > 0 && (
        <div className="debug-info" style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <details>
            <summary>Деталі даних (для відладки)</summary>
            <p>Перші 3 точки даних:</p>
            <pre>{JSON.stringify(chartData.slice(0, 3), null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default UserView;