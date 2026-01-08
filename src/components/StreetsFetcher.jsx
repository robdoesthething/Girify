import React, { useState } from 'react';
import { Download, Play, AlertCircle } from 'lucide-react';

const StreetsFetcher = () => {
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState('');
  const [streets, setStreets] = useState([]);
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

  const tierMapping = {
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

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    try {
      const response = await fetch(url, options);

      // If satisfied with response, return it
      if (response.ok) return response;

      // If rate limited (429) or server error (500+), throw to trigger retry
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      // Client errors (400-499) usually shouldn't be retried
      return response;
    } catch (error) {
      if (retries > 0) {
        setStatus(`⚠️ Error: ${error.message}. Retrying in ${delay / 1000}s...`);
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

      // Using fetchWithRetry directly
      const responseReal = await fetchWithRetry(apiMirror, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
      });

      // Note: In the previous failed lint, I had a 'response' variable unused.
      // I've removed the redundant first call.

      if (!responseReal.ok) {
        throw new Error(`API error: ${responseReal.status}`);
      }

      const data = await responseReal.json();
      setProgress(`Received ${data.elements.length} street segments`);

      // Process the data
      const processedStreets = new Map();

      data.elements.forEach(element => {
        if (!element.tags?.name) return;

        const name = element.tags.name;
        const highway = element.tags.highway;
        const tier = tierMapping[highway] || 4;

        // Convert geometry from [lon, lat] to [lat, lon] and round
        const geometry =
          element.geometry?.map(coord => [
            Number(coord.lat.toFixed(5)),
            Number(coord.lon.toFixed(5)),
          ]) || [];

        if (geometry.length === 0) return;

        // Group by name (same street may have multiple segments)
        if (!processedStreets.has(name)) {
          processedStreets.set(name, {
            id: `street_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: name,
            tier: tier,
            geometry: [],
          });
        }

        processedStreets.get(name).geometry.push(geometry);
      });

      const streetArray = Array.from(processedStreets.values());

      // Sort by tier then name
      streetArray.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.name.localeCompare(b.name);
      });

      setStreets(streetArray);
      setStatus(`✓ Successfully processed ${streetArray.length} unique streets`);
      setProgress(
        `Tier breakdown: T1=${streetArray.filter(s => s.tier === 1).length}, T2=${streetArray.filter(s => s.tier === 2).length}, T3=${streetArray.filter(s => s.tier === 3).length}, T4=${streetArray.filter(s => s.tier === 4).length}`
      );
    } catch (error) {
      setStatus(`Error: ${error.message}`);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Barcelona Streets Fetcher</h1>
              <p className="text-gray-600">
                Fetch all streets from OpenStreetMap with proper tier classification
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <label htmlFor="api-mirror-select" className="text-sm font-semibold text-gray-700">
                API Mirror:
              </label>
              <select
                id="api-mirror-select"
                value={apiMirror}
                onChange={e => setApiMirror(e.target.value)}
                className="p-2 border rounded-md text-sm bg-gray-50 hover:bg-white transition-colors cursor-pointer"
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
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
                className={`p-4 rounded-lg ${status.includes('Error') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className={`w-5 h-5 mt-0.5 ${status.includes('Error') ? 'text-red-600' : 'text-green-600'}`}
                  />
                  <div className="flex-1">
                    <p
                      className={`font-medium ${status.includes('Error') ? 'text-red-800' : 'text-green-800'}`}
                    >
                      {status}
                    </p>
                    {progress && <p className="text-sm text-gray-600 mt-1">{progress}</p>}
                  </div>
                </div>
              </div>
            )}

            {streets.length > 0 && (
              <div className="space-y-4">
                <button
                  onClick={downloadJSON}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download JSON ({streets.length} streets)
                </button>

                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-gray-800 mb-3">Preview (first 10 streets):</h3>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(streets.slice(0, 10), null, 2)}
                  </pre>
                  {streets.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2 italic">
                      ... and {streets.length - 10} more streets
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Data Format:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
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
