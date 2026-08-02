import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader2, MapPin, Satellite, Map as MapIcon } from 'lucide-react';

const markerIcon = L.divIcon({
  html: '<div style="background:#f59e0b;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.4);margin-top:-14px"></div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const STREET_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function AddressLookup({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [satellite, setSatellite] = useState(true);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize from existing value
  useEffect(() => {
    if (value?.address && !query) {
      const display = [value.address, [value.postal_code, value.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
      setQuery(display);
      if (value.lat && value.lng) setCoords([value.lat, value.lng]);
    }
  }, []);

  // Debounced search via DAWA
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://dawa.aws.dk/autocomplete?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const selectAddress = (s) => {
    const d = s.data || {};
    const address = [d.vejnavn, d.husnr].filter(Boolean).join(' ') + (d.etage ? `, ${d.etage}.` : '') + (d.dør ? ` ${d.dør}` : '');
    const postal_code = d.postnr || '';
    const city = d.postnrnavn || '';
    const lat = d.y || s.adgangsadresse?.koordinater?.[1];
    const lng = d.x || s.adgangsadresse?.koordinater?.[0];

    setQuery(s.tekst);
    setShowSuggestions(false);
    if (lat && lng) setCoords([lat, lng]);
    else setCoords(null);
    onChange({ address: address.trim(), postal_code, city, lat: lat || null, lng: lng || null });
  };

  const blurTimeout = useRef(null);
  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setShowSuggestions(false), 200);
  };
  const handleFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setShowSuggestions(true);
  };

  return (
    <div className="space-y-3">
      {/* Address search input with autocomplete */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Søg adresse — f.eks. Strandvejen 1, 2100"
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-input bg-transparent text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 animate-spin" />}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-xl max-h-64 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => selectAddress(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-amber-50 transition flex items-start gap-2 border-b border-slate-50 last:border-0"
              >
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-700">{s.tekst}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map preview */}
      {coords && (
        <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height: '260px' }}>
          <MapContainer
            center={coords}
            zoom={18}
            scrollWheelZoom={false}
            zoomControl={false}
            attributionControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url={satellite ? SATELLITE_URL : STREET_URL} />
            <Marker position={coords} icon={markerIcon} />
          </MapContainer>
          <button
            type="button"
            onClick={() => setSatellite(!satellite)}
            className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-slate-950/80 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-950 transition backdrop-blur"
          >
            {satellite ? <><MapIcon className="w-3.5 h-3.5" /> Kort</> : <><Satellite className="w-3.5 h-3.5" /> Satellit</>}
          </button>
          <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/80 text-white px-3 py-1.5 rounded-lg text-xs backdrop-blur flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
          </div>
        </div>
      )}

      {/* Read-only fields showing parsed address */}
      {value?.address && (
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <input value={value.address} readOnly placeholder="Adresse" className="w-full px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-700" />
          </div>
          <div>
            <input value={value.postal_code || ''} readOnly placeholder="Postnr." className="w-full px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-700" />
          </div>
          <div>
            <input value={value.city || ''} readOnly placeholder="By" className="w-full px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-700" />
          </div>
        </div>
      )}
    </div>
  );
}