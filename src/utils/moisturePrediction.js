// utils/moisturePrediction.js

export const calculateMoistureForecast = (data, sensorColumn, dateColumn, threshold = 18) => {
  if (!Array.isArray(data) || data.length < 2) return null;

  // Групування даних по тижнях
  const groupsByWeek = {};
  const parseDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  data.forEach((row) => {
    const date = parseDate(row[dateColumn]);
    const value = parseFloat(row[sensorColumn]);
    if (!date || isNaN(value)) return;

    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    if (!groupsByWeek[weekKey]) groupsByWeek[weekKey] = [];
    groupsByWeek[weekKey].push({ timestamp: date.getTime(), value });
  });

  // Беремо останній тиждень
  const sortedWeeks = Object.keys(groupsByWeek).sort();
  const latestWeekKey = sortedWeeks.at(-1);
  const lastWeekData = groupsByWeek[latestWeekKey];
  if (!lastWeekData || lastWeekData.length < 2) return null;

  // Сортуємо дані за часом
  lastWeekData.sort((a, b) => a.timestamp - b.timestamp);

  const deltas = [];
  for (let i = 1; i < lastWeekData.length; i++) {
    const prev = lastWeekData[i - 1];
    const curr = lastWeekData[i];
    const deltaHrs = (curr.timestamp - prev.timestamp) / (1000 * 60 * 60);
    const deltaVal = prev.value - curr.value;
    if (deltaVal > 0 && deltaHrs > 0) {
      deltas.push(deltaVal / deltaHrs); // швидкість падіння
    }
  }

  if (!deltas.length) return null;

  const avgDropPerHour = deltas.reduce((a, b) => a + b, 0) / deltas.length;

  const latestReading = lastWeekData.at(-1);
  const hoursLeft = avgDropPerHour > 0
    ? (latestReading.value - threshold) / avgDropPerHour
    : null;

  return {
    latestValue: latestReading.value,
    avgDropPerHour: avgDropPerHour.toFixed(3),
    estimatedHoursToThreshold: hoursLeft ? Math.round(hoursLeft) : null
  };
};

// Допоміжна функція для тижня
function getWeekNumber(date) {
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
}
