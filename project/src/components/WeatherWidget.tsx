import { useEffect, useState } from 'react';
import { MapPin, Clock, RefreshCw, Loader2, Pencil } from 'lucide-react';
import type { SchoolSettings } from '../types';
import { computeOutdoorScore, fetchForecastForClassTime, geocodeLocation, type HourlyForecast } from '../weather';

interface WeatherWidgetProps {
  settings: SchoolSettings | null;
  onSaveSettings: (settings: SchoolSettings) => void;
}

const colorClasses: Record<string, string> = {
  red: 'bg-red-50 border-red-200 text-red-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  lime: 'bg-lime-50 border-lime-200 text-lime-700',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
};

const scoreBarClasses: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  lime: 'bg-lime-500',
  emerald: 'bg-emerald-500',
};

function SettingsForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: SchoolSettings | null;
  onCancel?: () => void;
  onSaved: (settings: SchoolSettings) => void;
}) {
  const [locationQuery, setLocationQuery] = useState(initial?.locationQuery || '');
  const [classTime, setClassTime] = useState(initial?.classTime || '11:15');
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationQuery.trim() || !classTime) return;
    setLooking(true);
    setError(null);
    try {
      const geo = await geocodeLocation(locationQuery.trim());
      if (!geo) {
        setError('No location found for that address/zip. Try being more specific.');
        return;
      }
      onSaved({ locationQuery: locationQuery.trim(), lat: geo.lat, lon: geo.lon, classTime });
    } catch (err) {
      setError('Could not look up that location right now. Please try again.');
    } finally {
      setLooking(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">School address or zip code</label>
        <input
          type="text"
          value={locationQuery}
          onChange={(e) => setLocationQuery(e.target.value)}
          placeholder="e.g. 12345 or 100 Main St, Utica NY"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Typical PE class time</label>
        <input
          type="time"
          value={classTime}
          onChange={(e) => setClassTime(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={looking}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          {looking ? 'Looking up location...' : 'Save Location'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function WeatherWidget({ settings, onSaveSettings }: WeatherWidgetProps) {
  const [editing, setEditing] = useState(false);
  const [forecast, setForecast] = useState<HourlyForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadForecast = async (s: SchoolSettings) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchForecastForClassTime(s.lat, s.lon, s.classTime);
      setForecast(result);
    } catch (err) {
      setError('Could not fetch the forecast right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (settings && !editing) {
      void loadForecast(settings);
    }
  }, [settings?.lat, settings?.lon, settings?.classTime, editing]);

  if (!settings || editing) {
    return (
      <div className="mx-auto max-w-md">
        <SettingsForm
          initial={settings}
          onCancel={settings ? () => setEditing(false) : undefined}
          onSaved={(s) => {
            onSaveSettings(s);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  const prediction = forecast
    ? computeOutdoorScore(forecast.tempF, forecast.feelsLikeF, forecast.precipProbPercent, forecast.windMph)
    : null;

  return (
    <div className="mx-auto max-w-md space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> {settings.locationQuery}
          <span className="mx-1">·</span>
          <Clock className="h-4 w-4" /> {settings.classTime}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => loadForecast(settings)} className="flex items-center gap-1 text-slate-500 hover:text-slate-700" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-slate-500 hover:text-slate-700" title="Edit location/time">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && !forecast ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading forecast...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : forecast && prediction ? (
        <div className={`rounded-xl border p-5 shadow-sm ${colorClasses[prediction.colorClass]}`}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
            Forecast for {new Date(forecast.time).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
          </p>
          <p className="mt-1 text-2xl font-bold">{prediction.label}</p>
          <div className="mt-3 h-2 w-full rounded-full bg-white/60">
            <div
              className={`h-2 rounded-full ${scoreBarClasses[prediction.colorClass]}`}
              style={{ width: `${prediction.score}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-lg font-bold">{Math.round(forecast.tempF)}°F</p>
              <p className="text-xs opacity-75">Temp</p>
            </div>
            <div>
              <p className="text-lg font-bold">{Math.round(forecast.feelsLikeF)}°F</p>
              <p className="text-xs opacity-75">Feels Like</p>
            </div>
            <div>
              <p className="text-lg font-bold">{Math.round(forecast.precipProbPercent)}%</p>
              <p className="text-xs opacity-75">Precip</p>
            </div>
          </div>
          <p className="mt-3 text-xs opacity-75">Wind {Math.round(forecast.windMph)} mph</p>
        </div>
      ) : null}
    </div>
  );
}
