import { AlertCircle, Download, Play } from 'lucide-react';
import React, { useState } from 'react';
import { API } from '../../../config/constants';
import { useTheme } from '../../../context/ThemeContext';
import { themeClasses } from '../../../utils/themeUtils';

const StreetsFetcher: React.FC = () => {
  const { theme } = useTheme();
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState('');
  const [streets, setStreets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // API Mirror State
  const [apiMirror, setApiMirror] = useState('https://overpass-api.de/api/interpreter');

  const API_MIRRORS = [
    { name: 'Main (overpass-api.de)', url: 'https://overpass-api.de/api/interpreter' },
    { name: 'Kumi Systems', url: 'https://overpass.kumi.systems/api/interpreter' },
    { name: 'French Mirror', url: 'https://overpass.openstreetmap.fr/api/interpreter' },
  ];

  // Barcelona bounding box: [min_lat, min_lon, max_lat, max_lon]
  const BBOX = '41.3200,2.0524,41.4695,2.2280';

  const tierMapping: Record<string, number> = {
    motorway: 1,
    trunk: 1,
    primary: 1,
    secondary: 2,
    tertiary: 3,
    residential: 4,
    living_street: 4,
    unclassified: 4,
    service: 4,
    pedestrian: 4,
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    retries = 3,
    delay = 1000
  ): Promise<Response> => {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(API.TIMEOUT) });

      if (response.ok) {
        return response;
      }

      if (
        response.status === API.HTTP.TOO_MANY_REQUESTS ||
        response.status >= API.HTTP.SERVER_ERROR
      ) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response;
    } catch (error: unknown) {
      if (retries > 0) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setStatus(`⚠️ Error: ${errorMessage}. Retrying in ${delay / 1000}s...`);
        await wait(delay);
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  const fetchStreets = async () => {
    setLoading(true);
    setStatus(`Fetching street data from ${API_MIRRORS.find(m => m.url === apiMirror)?.name}...`);
    setProgress('');
    setStreets([]);

    try {
      // Overpass API query for Barcelona streets
      const query = `
        [out:json][timeout:180];
        (
          way["highway"]["name"](${BBOX});
        );
        out geom;
      `;

      const responseReal = await fetchWithRetry(apiMirror, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!responseReal.ok) {
        throw new Error(`API error: ${responseReal.status}`);
      }

      const data = await responseReal.json();
      setProgress(`Received ${data.elements.length} street segments`);

      const processedStreets = new Map();

      data.elements.forEach(
        (element: {
          tags?: Record<string, string>;
          geometry?: Array<{ lat: number; lon: number }>;
        }) => {
          if (!element.tags?.name) {
            return;
          }

          const name = element.tags.name;
          const highway = element.tags.highway;
          const tier = (highway ? tierMapping[highway] : undefined) ?? 4;

          const geometry =
            element.geometry?.map((coord: { lat: number; lon: number }) => [
              Number(coord.lat.toFixed(5)),
              Number(coord.lon.toFixed(5)),
            ]) || [];

          if (geometry.length === 0) {
            return;
          }

          if (!processedStreets.has(name)) {
            processedStreets.set(name, {
              id: `street_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              name: name,
              tier: tier,
              geometry: [],
            });
          }

          processedStreets.get(name).geometry.push(geometry);
        }
      );

      const streetArray = Array.from(processedStreets.values());

      streetArray.sort((a, b) => {
        if (a.tier !== b.tier) {
          return a.tier - b.tier;
        }
        return a.name.localeCompare(b.name);
      });

      setStreets(streetArray);
      setStatus(`✓ Successfully processed ${streetArray.length} unique streets`);
      const t1Count = streetArray.filter(s => s.tier === 1).length;
      const t2Count = streetArray.filter(s => s.tier === 2).length;
      const t3Count = streetArray.filter(s => s.tier === 3).length;
      const t4Count = streetArray.filter(s => s.tier === 4).length;
      setProgress(`Tier breakdown: T1=${t1Count}, T2=${t2Count}, T3=${t3Count}, T4=${t4Count}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error: ${errorMessage}`);
      setProgress('Please try another mirror or wait a moment.');
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(streets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'barcelona_streets.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen p-8 pt-20 ${themeClasses(theme, 'bg-slate-950', 'bg-slate-50')}`}>
      <div className="max-w-4xl mx-auto">
        <div
          className={`rounded-2xl shadow-xl p-8 border ${themeClasses(theme, 'bg-slate-900 border-slate-700', 'bg-white border-slate-200')}`}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1
                className={`text-3xl font-bold mb-2 font-inter ${themeClasses(theme, 'text-slate-100', 'text-slate-800')}`}
              >
                Barcelona Streets Fetcher
              </h1>
              <p
                className={`font-inter ${themeClasses(theme, 'text-slate-400', 'text-slate-600')}`}
              >
                Fetch all streets from OpenStreetMap with proper tier classification
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <label
                htmlFor="api-mirror-select"
                className={`text-sm font-semibold font-inter ${themeClasses(theme, 'text-slate-300', 'text-slate-700')}`}
              >
                API Mirror:
              </label>
              <select
                id="api-mirror-select"
                value={apiMirror}
                onChange={e => setApiMirror(e.target.value)}
                className={`p-2 border rounded-xl text-sm transition-colors cursor-pointer font-inter ${themeClasses(theme, 'bg-slate-800 border-slate-600 text-slate-200', 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-white')}`}
              >
                {API_MIRRORS.map(m => (
                  <option key={m.url} value={m.url}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={fetchStreets}
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-600 disabled:text-slate-400 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors font-inter"
              type="button"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Fetching...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Fetch Streets
                </>
              )}
            </button>

            {status && (
              <div
                className={`p-4 rounded-xl border ${status.includes('Error') ? themeClasses(theme, 'bg-red-950/50 border-red-800', 'bg-red-50 border-red-200') : themeClasses(theme, 'bg-emerald-950/50 border-emerald-800', 'bg-green-50 border-green-200')}`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className={`w-5 h-5 mt-0.5 ${status.includes('Error') ? 'text-red-500' : 'text-emerald-500'}`}
                  />
                  <div className="flex-1">
                    <p
                      className={`font-medium font-inter ${status.includes('Error') ? themeClasses(theme, 'text-red-300', 'text-red-800') : themeClasses(theme, 'text-emerald-300', 'text-green-800')}`}
                    >
                      {status}
                    </p>
                    {progress && (
                      <p
                        className={`text-sm mt-1 font-inter ${themeClasses(theme, 'text-slate-400', 'text-slate-600')}`}
                      >
                        {progress}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {streets.length > 0 && (
              <div className="space-y-4">
                <button
                  onClick={downloadJSON}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors font-inter"
                  type="button"
                >
                  <Download className="w-5 h-5" />
                  Download JSON ({streets.length} streets)
                </button>

                <div
                  className={`rounded-xl p-4 max-h-96 overflow-y-auto ${themeClasses(theme, 'bg-slate-800', 'bg-slate-50')}`}
                >
                  <h3
                    className={`font-semibold mb-3 font-inter ${themeClasses(theme, 'text-slate-200', 'text-slate-800')}`}
                  >
                    Preview (first 10 streets):
                  </h3>
                  <pre
                    className={`text-xs whitespace-pre-wrap font-mono ${themeClasses(theme, 'text-slate-300', 'text-slate-700')}`}
                  >
                    {JSON.stringify(streets.slice(0, 10), null, 2)}
                  </pre>
                  {streets.length > 10 && (
                    <p
                      className={`text-sm mt-2 italic font-inter ${themeClasses(theme, 'text-slate-500', 'text-slate-500')}`}
                    >
                      ... and {streets.length - 10} more streets
                    </p>
                  )}
                </div>

                <div
                  className={`border rounded-xl p-4 ${themeClasses(theme, 'bg-sky-950/50 border-sky-800', 'bg-blue-50 border-blue-200')}`}
                >
                  <h3
                    className={`font-semibold mb-2 font-inter ${themeClasses(theme, 'text-sky-300', 'text-blue-900')}`}
                  >
                    Data Format:
                  </h3>
                  <ul
                    className={`text-sm space-y-1 font-inter ${themeClasses(theme, 'text-sky-200', 'text-blue-800')}`}
                  >
                    <li>
                      • <strong>id</strong>: Unique identifier (auto-generated)
                    </li>
                    <li>
                      • <strong>name</strong>: Street display name
                    </li>
                    <li>
                      • <strong>tier</strong>: 1=Major highways, 2=Avenues, 3=Standard streets,
                      4=Residential
                    </li>
                    <li>
                      • <strong>geometry</strong>: Array of polylines in [Lat, Lon] format
                      (Leaflet-ready)
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreetsFetcher;
