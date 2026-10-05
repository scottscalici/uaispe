export interface OutdoorPrediction {
  score: number;
  label: string;
  colorClass: string;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/**
 * A weighted "will we go outside" score rather than a rigid temperature ladder - it naturally
 * handles combinations no one thought to write a rule for (65F with light rain and calm wind).
 * Centered on a 70F ideal (both actual and feels-like - the colder of the two is the limiting
 * factor). Cold is penalized much more steeply than warmth - 55-60F was described as only a
 * "decent chance" even with zero precipitation, while a hot day was never called a dealbreaker -
 * then both are further knocked down for precipitation chance and wind, with a hard floor when
 * there's real precipitation risk and it's genuinely cold.
 */
export function computeOutdoorScore(tempF: number, feelsLikeF: number, precipProbPercent: number, windMph: number): OutdoorPrediction {
  const effectiveTemp = Math.min(tempF, feelsLikeF);

  let score = 100;
  score -= effectiveTemp < 70 ? (70 - effectiveTemp) * 3 : (effectiveTemp - 70) * 1;
  if (precipProbPercent > 30) score -= (precipProbPercent - 30) * 1.2;
  if (windMph > 15) score -= (windMph - 15) * 1.5;

  const hasPrecip = precipProbPercent >= 40;
  if (hasPrecip && effectiveTemp < 55) score = Math.min(score, 10);

  score = clamp(Math.round(score), 0, 100);

  let label: string;
  let colorClass: string;
  if (score < 20) { label = 'No Go'; colorClass = 'red'; }
  else if (score < 40) { label = 'Slim Chance'; colorClass = 'orange'; }
  else if (score < 60) { label = 'Decent Chance'; colorClass = 'amber'; }
  else if (score < 80) { label = 'Good Chance'; colorClass = 'lime'; }
  else { label = 'Great Day to Go Out!'; colorClass = 'emerald'; }

  return { score, label, colorClass };
}

export interface HourlyForecast {
  time: string;
  tempF: number;
  feelsLikeF: number;
  precipProbPercent: number;
  windMph: number;
}

/** Open-Meteo - free, no API key, CORS-enabled for direct browser use. */
export async function fetchForecastForClassTime(lat: number, lon: number, classTime: string): Promise<HourlyForecast> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=2&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch forecast');
  const data = await res.json();

  const times: string[] = data.hourly.time;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const targetTime = new Date(`${todayStr}T${classTime}`).getTime();

  let bestIdx = 0;
  let bestDiff = Infinity;
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - targetTime);
    if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
  });

  return {
    time: times[bestIdx],
    tempF: data.hourly.temperature_2m[bestIdx],
    feelsLikeF: data.hourly.apparent_temperature[bestIdx],
    precipProbPercent: data.hourly.precipitation_probability[bestIdx],
    windMph: data.hourly.wind_speed_10m[bestIdx],
  };
}

export interface DayForecast extends HourlyForecast {
  dateStr: string;
  weekday: string;
}

/** The next N weekdays (Mon-Fri only, weekends skipped), starting today if today is a weekday. */
function getNextWeekdays(count: number): string[] {
  const dates: string[] = [];
  const d = new Date();
  while (dates.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/** School-week preview: the next 5 weekdays' forecasts at class time, skipping Saturday/Sunday. */
export async function fetchFiveDayForecast(lat: number, lon: number, classTime: string): Promise<DayForecast[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch forecast');
  const data = await res.json();
  const times: string[] = data.hourly.time;

  return getNextWeekdays(5).map((dateStr) => {
    const targetTime = new Date(`${dateStr}T${classTime}`).getTime();
    let bestIdx = 0;
    let bestDiff = Infinity;
    times.forEach((t, i) => {
      if (!t.startsWith(dateStr)) return;
      const diff = Math.abs(new Date(t).getTime() - targetTime);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    });
    return {
      dateStr,
      weekday: new Date(`${dateStr}T00:00`).toLocaleDateString(undefined, { weekday: 'short' }),
      time: times[bestIdx],
      tempF: data.hourly.temperature_2m[bestIdx],
      feelsLikeF: data.hourly.apparent_temperature[bestIdx],
      precipProbPercent: data.hourly.precipitation_probability[bestIdx],
      windMph: data.hourly.wind_speed_10m[bestIdx],
    };
  });
}

/** Nominatim (OpenStreetMap) - free, no API key, one-time lookup when the admin sets a location. */
export async function geocodeLocation(query: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed');
  const results = await res.json();
  if (!results || results.length === 0) return null;
  return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon), displayName: results[0].display_name };
}
