// SensorChart.jsx
import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';

const SensorChart = ({ data, config, sensors, visibleSensors, timeRange }) => {
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

  const CustomTooltip = ({ active, payload, label, coordinate }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        position: 'absolute',
        left: coordinate?.x,
        top: coordinate?.y - 60,
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
  };

  return (
    <ResponsiveContainer width="100%" height={500}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
        <XAxis dataKey="timestamp" tickFormatter={formatDate} stroke="#000" fontSize={10} />
        <YAxis stroke="#000" domain={[yMin, yMax]} fontSize={10} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <defs>
    <linearGradient id="colorSensor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
    </linearGradient>
  </defs>
        
        {/* Reference Zones - лише один раз */}
        <ReferenceArea y1={0} y2={6} fill="#ff4444" fillOpacity={0.2} stroke="none" />
        <ReferenceArea y1={6} y2={18} fill="#ffcc00" fillOpacity={0.3} stroke="none" />
        <ReferenceArea y1={18} y2={yMax} fill="#44ff44" fillOpacity={0.2} stroke="none" />
        <ReferenceLine y={6} stroke="#ff4444" strokeWidth={2} strokeDasharray="5 5" opacity={0.7} />
        <ReferenceLine y={18} stroke="#44ff44" strokeWidth={2} strokeDasharray="5 5" opacity={0.7} />
        <ReferenceLine y={0} stroke="#9CA3AF" opacity={0.5} />
        
        {activeSensors.map(sensor => (
          <Line
            key={sensor.column}
            type="monotone"
            dataKey={sensor.column}
            stroke={sensor.color || '#3b82f6'}
            strokeWidth={2}
            dot={false}
            name={sensor.name}
            fill="url(#colorSensor)"        // 🔥 ось це
            fillOpacity={1}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default React.memo(SensorChart);