'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Droplets, MapPin, Search, Sun, Wind } from 'lucide-react';

type WeatherResult = {
  name: string;
  country: string;
  timezone: string;
  current: { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number; is_day: number };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
};

const conditionFor = (code: number, isDay = 1) => {
  if (code === 0) return { label: 'Clear sky', Icon: isDay ? Sun : Cloud };
  if (code <= 2) return { label: 'Partly cloudy', Icon: CloudSun };
  if (code === 3) return { label: 'Overcast', Icon: Cloud };
  if (code <= 48) return { label: 'Foggy', Icon: CloudFog };
  if (code <= 57) return { label: 'Drizzle', Icon: CloudDrizzle };
  if (code <= 67 || (code >= 80 && code <= 82)) return { label: 'Rain', Icon: CloudRain };
  if (code <= 77 || (code >= 85 && code <= 86)) return { label: 'Snow', Icon: CloudSnow };
  if (code >= 95) return { label: 'Thunderstorm', Icon: CloudLightning };
  return { label: 'Changing conditions', Icon: CloudSun };
};

export default function WeatherProject() {
  const [query, setQuery] = useState('Toronto');
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadWeather(city: string) {
    if (!city.trim()) return;
    setLoading(true);
    setError('');
    try {
      const locationResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      if (!locationResponse.ok) throw new Error('Location search is unavailable right now.');
      const locationData = await locationResponse.json();
      const place = locationData.results?.[0];
      if (!place) throw new Error(`No location found for “${city}”. Try another city.`);
      const params = new URLSearchParams({ latitude: String(place.latitude), longitude: String(place.longitude), current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day', daily: 'weather_code,temperature_2m_max,temperature_2m_min', timezone: 'auto', forecast_days: '5' });
      const forecastResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!forecastResponse.ok) throw new Error('Forecast data is unavailable right now. Please try again.');
      const forecast = await forecastResponse.json();
      setWeather({ name: place.name, country: place.country, timezone: forecast.timezone, current: forecast.current, daily: forecast.daily });
      setQuery(place.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong while loading weather.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadWeather('Toronto'); }, []);
  function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void loadWeather(query); }
  const convert = (value: number) => Math.round(unit === 'C' ? value : value * 9 / 5 + 32);
  const currentCondition = weather ? conditionFor(weather.current.weather_code, weather.current.is_day) : null;
  const CurrentIcon = currentCondition?.Icon ?? CloudSun;

  return <main className="project-app weather-app">
    <header className="project-topbar"><a href="https://shivanshthataiportfolio.onrender.com/#work"><ArrowLeft size={17} /> Portfolio</a><span>FIELD NOTES / 001</span></header>
    <section className="weather-shell">
      <div className="project-heading"><p className="project-kicker">A live weather dashboard</p><h1>Weather,<br /><em>without the noise.</em></h1><p>Current conditions and a five-day outlook, powered by live forecast data.</p></div>
      <form className="weather-search" onSubmit={submitSearch}><label className="sr-only" htmlFor="city-search">Search a city</label><MapPin size={18} /><input id="city-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a city" /><button type="submit" disabled={loading} aria-label="Search city"><Search size={18} /></button></form>
      {error && <p className="project-error" role="alert">{error}</p>}
      {loading && !weather ? <div className="project-loading">Loading current conditions…</div> : weather && currentCondition && <>
        <section className="weather-now" aria-live="polite"><div className="weather-place"><span>{weather.name}, {weather.country}</span><small>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', timeZone: weather.timezone }).format(new Date())}</small></div><button className="unit-switch" onClick={() => setUnit(unit === 'C' ? 'F' : 'C')} aria-label={`Switch to degrees ${unit === 'C' ? 'Fahrenheit' : 'Celsius'}`}>°{unit}<span> / °{unit === 'C' ? 'F' : 'C'}</span></button><div className="weather-current"><CurrentIcon size={64} strokeWidth={1.2} /><div><strong>{convert(weather.current.temperature_2m)}°</strong><span>{currentCondition.label}</span></div></div><p className="feels-like">Feels like {convert(weather.current.apparent_temperature)}°</p><div className="weather-metrics"><div><Droplets /><span>Humidity</span><strong>{weather.current.relative_humidity_2m}%</strong></div><div><Wind /><span>Wind</span><strong>{Math.round(weather.current.wind_speed_10m)} km/h</strong></div></div></section>
        <section className="forecast"><div className="forecast-heading"><h2>Next five days</h2><span>LOCAL FORECAST</span></div><div className="forecast-list">{weather.daily.time.map((day, index) => { const dayCondition = conditionFor(weather.daily.weather_code[index]); const DayIcon = dayCondition.Icon; return <div className="forecast-day" key={day}><span>{index === 0 ? 'Today' : new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: weather.timezone }).format(new Date(`${day}T12:00:00`))}</span><DayIcon size={21} /><span className="forecast-condition">{dayCondition.label}</span><strong>{convert(weather.daily.temperature_2m_max[index])}° <small>{convert(weather.daily.temperature_2m_min[index])}°</small></strong></div>; })}</div></section>
      </>}
      <footer className="project-credit">Forecast source: Open-Meteo · No account or API key required</footer>
    </section>
  </main>;
}
