import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea
} from 'recharts';

const SensorChart = ({ data, config, sensors, visibleSensors, timeRange }) => {
  const [tooltipData, setTooltipData] = useState(null);
  const [isTouching, setIsTouching] = useState(false);
  const chartContainerRef = useRef(null);
  const lastTouchTime = useRef(0);

  const parseDate = (dateString) => {
    try {
      const match = /Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/.exec(dateString);
      if (match) {
        const [, year, month, day, hour, minute, second] = match.map(Number);
        return new Date(year, month, day, hour, minute, second).getTime();
      }

      const parts = dateString.toString().split(' ');
      if (parts.length >= 2) {
        const [d, m, y] = parts[0].split('.').map(Number);
        const [h, min, s = 0] = parts[1].split(':').map(Number);
        return new Date(y, m - 1, d, h, min, s).getTime();
      }

      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? null : parsed.getTime();
    } catch {
      return null;
    }
  };

  const formatDate = (ts, full = false) => {
    const date = new Date(ts);
    return date.toLocaleDateString('uk-UA', full ? {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    } : {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const chartData = useMemo(() => {
    if (!data?.length) return [];

    let result = data.map(row => {
      const timestamp = parseDate(row[config.xAxis]);
      if (!timestamp) return null;

      const obj = {
        timestamp,
        name: row[config.xAxis],
        displayTime: formatDate(timestamp),
      };

      sensors.forEach(s => {
        if (visibleSensors[s.column] !== false) {
          const val = parseFloat(row[s.column]);
          obj[s.column] = isNaN(val) ? null : val;
        }
      });

      return obj;
    }).filter(Boolean);

    result.sort((a, b) => a.timestamp - b.timestamp);

    if (timeRange !== 'all') {
      const now = result.at(-1)?.timestamp || Date.now();
      const ranges = { '1d': 864e5, '7d': 7 * 864e5 };
      const cutoff = now - (ranges[timeRange] || 0);
      result = result.filter(d => d.timestamp >= cutoff);
    }

    return result;
  }, [data, config, sensors, visibleSensors, timeRange]);

  const activeSensors = sensors.filter(s => visibleSensors[s.column] !== false);

  const getYAxisRange = () => {
    if (!chartData.length) return { yMin: 0, yMax: 24 };
    const values = chartData.flatMap(p =>
      activeSensors.map(s => p[s.column]).filter(v => v !== null)
    );
    if (!values.length) return { yMin: 0, yMax: 24 };
    let min = Math.min(...values);
    let max = Math.max(...values);
    const pad = (max - min) * 0.1;
    return { yMin: Math.max(min - pad, 0), yMax: max + pad };
  };

  const { yMin, yMax } = getYAxisRange();

  // Виносимо findClosestDataPoint окремо, щоб уникнути циклічних залежностей
  const findClosestDataPoint = useCallback((e, chartData, activeSensors) => {
    if (!chartData.length || !chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const rect = container.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    
    // Знаходимо найближчу точку даних по X координаті
    const xPercentage = touchX / rect.width;
    const dataIndex = Math.min(
      Math.max(0, Math.round(xPercentage * (chartData.length - 1))),
      chartData.length - 1
    );

    const point = chartData[dataIndex];
    if (!point) return;

    // Створюємо payload для тултіпа
    const payload = activeSensors.map(sensor => ({
      name: sensor.name,
      value: point[sensor.column],
      color: sensor.color || '#3b82f6',
      dataKey: sensor.column
    })).filter(entry => entry.value !== null);

    if (payload.length === 0) return;

    setTooltipData({
      x: touchX,
      y: e.touches[0].clientY - rect.top,
      payload,
      label: point.timestamp
    });
  }, []);

  const handleTouchStart = useCallback((e) => {
    const now = Date.now();
    // Запобігаємо подвійним спрацьовуванням
    if (now - lastTouchTime.current < 100) return;
    lastTouchTime.current = now;

    setIsTouching(true);
    findClosestDataPoint(e, chartData, activeSensors);
  }, [chartData, activeSensors, findClosestDataPoint]);

  const handleTouchMove = useCallback((e) => {
    if (!isTouching) return;
    findClosestDataPoint(e, chartData, activeSensors);
  }, [isTouching, chartData, activeSensors, findClosestDataPoint]);

  const handleTouchEnd = useCallback((e) => {
    setIsTouching(false);
    setTooltipData(null);
    
    // Примусово видаляємо всі активні елементи
    setTimeout(() => {
      const activeElements = document.querySelectorAll('.recharts-active-dot, .recharts-tooltip-cursor');
      activeElements.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    }, 10);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!chartContainerRef.current || !chartData.length) return;
    
    const container = chartContainerRef.current;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Знаходимо найближчу точку даних по X координаті
    const xPercentage = mouseX / rect.width;
    const dataIndex = Math.min(
      Math.max(0, Math.round(xPercentage * (chartData.length - 1))),
      chartData.length - 1
    );

    const point = chartData[dataIndex];
    if (!point) return;

    const payload = activeSensors.map(sensor => ({
      name: sensor.name,
      value: point[sensor.column],
      color: sensor.color || '#3b82f6',
      dataKey: sensor.column
    })).filter(entry => entry.value !== null);

    if (payload.length === 0) return;

    setTooltipData({
      x: mouseX,
      y: mouseY,
      payload,
      label: point.timestamp
    });
  }, [chartData, activeSensors]);

  // Власний тултіп, який не залежить від recharts
  const CustomTooltip = useCallback(() => {
    if (!tooltipData || !isTouching) return null;

    const { x, y, payload, label } = tooltipData;

    return (
      <div style={{
        position: 'absolute',
        left: x,
        top: y - 60,
        transform: 'translateX(-50%)',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '0.9rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 999,
        color: '#000'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{formatDate(label, true)}</div>
        {payload.map((entry, i) => (
          <div key={i}>
            <strong style={{ color: entry.color }}>{entry.name}:</strong> {entry.value}
          </div>
        ))}
      </div>
    );
  }, [tooltipData, isTouching]);

  return (
    <div 
      ref={chartContainerRef}
      style={{ position: 'relative', touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseEnter={() => setIsTouching(true)}
      onMouseLeave={() => {
        setIsTouching(false);
        setTooltipData(null);
      }}
      onMouseMove={handleMouseMove}
    >
      <ResponsiveContainer width="100%" height={500}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, bottom: 10, left: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            stroke="#000"
            fontSize={10}
          />
          <YAxis
            stroke="#000"
            domain={[yMin, yMax]}
            fontSize={10}
            width={30}
          />

          {/* Пустий тултіп для відключення стандартної поведінки */}
          <Tooltip content={() => null} />

          <Legend />

          <defs>
            {activeSensors.map(sensor => (
              <linearGradient
                key={sensor.column}
                id={`colorSensor-${sensor.column}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={sensor.color || '#3b82f6'} stopOpacity={0.4} />
                <stop offset="100%" stopColor={sensor.color || '#3b82f6'} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {/* Reference Zones */}
          <ReferenceArea y1={0} y2={6} fill="#ff4444" fillOpacity={0.2} stroke="none" />
          <ReferenceArea y1={6} y2={18} fill="#ffcc00" fillOpacity={0.3} stroke="none" />
          <ReferenceArea y1={18} y2={yMax} fill="#44ff44" fillOpacity={0.2} stroke="none" />
          <ReferenceLine y={6} stroke="#ff4444" strokeWidth={2} strokeDasharray="5 5" opacity={0.7} />
          <ReferenceLine y={18} stroke="#44ff44" strokeWidth={2} strokeDasharray="5 5" opacity={0.7} />
          <ReferenceLine y={0} stroke="#9CA3AF" opacity={0.5} />

          {activeSensors.map(sensor => (
            <Area
              key={sensor.column}
              type="monotone"
              dataKey={sensor.column}
              stroke={sensor.color || '#3b82f6'}
              strokeWidth={2}
              fill={`url(#colorSensor-${sensor.column})`}
              dot={false}
              activeDot={false} // Повністю вимикаємо стандартні точки
              name={sensor.name}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Власний тултіп, який ми повністю контролюємо */}
      <CustomTooltip />
    </div>
  );
};

export default React.memo(SensorChart);