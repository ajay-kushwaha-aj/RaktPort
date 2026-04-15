// src/components/LocateDonationSite.tsx
// RaktPort — Locate Donation Site v1
// GPS + Manual search, Firestore realtime, distance sorting, dark-mode

import React, { useState, useCallback } from 'react';
import {
  MapPin, Search, Navigation, Phone, Calendar,
  CheckCircle2, AlertCircle, Loader2, ExternalLink, X,
  Droplets, TestTubes, Building2, Filter,
} from 'lucide-react';
import {
  collection, query, where, getDocs, limit,
} from 'firebase/firestore';
import { db } from '../firebase';

/* ─── Types ─────────────────────────────────────────── */
interface BloodBank {
  id: string;
  name: string;
  city: string;
  cityLower: string;
  pincode: string;
  address: string;
  phone?: string;
  lat?: number;
  lng?: number;
  verified?: boolean;
  type: 'bloodbank';
}
interface DonationCamp {
  id: string;
  name: string;
  city: string;
  cityLower: string;
  pincode: string;
  address: string;
  date?: string;
  organizer?: string;
  lat?: number;
  lng?: number;
  type: 'camp';
}
type Site = BloodBank | DonationCamp;
type FilterTab = 'all' | 'bloodbank' | 'camp';

/* ─── Haversine distance (km) ──────────────────────── */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Distance label ───────────────────────────────── */
function distLabel(km: number | null) {
  if (km === null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

/* ─── Nominatim reverse-geocode ────────────────────── */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return (
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.village ||
      data?.address?.county ||
      ''
    );
  } catch {
    return '';
  }
}

/* ─── Firestore fetch ──────────────────────────────── */
async function fetchSitesFromCollection(
  col: string,
  type: 'bloodbank' | 'camp',
  cityOrPincode: string,
  userLat: number | null,
  userLng: number | null
): Promise<(Site & { dist: number | null })[]> {
  const isPin = /^\d{6}$/.test(cityOrPincode.trim());
  const cityLow = cityOrPincode.trim().toLowerCase();
  const cityRaw = cityOrPincode.trim();
  const results: (Site & { dist: number | null })[] = [];

  const addDoc = (doc: any) => {
    const d = doc.data();
    const lat = d.lat ?? d.latitude ?? null;
    const lng = d.lng ?? d.longitude ?? null;
    const dist =
      userLat !== null && userLng !== null && lat !== null && lng !== null
        ? haversine(userLat, userLng, lat, lng)
        : null;
    results.push({ id: doc.id, type, dist, lat, lng, ...d } as Site & { dist: number | null });
  };

  try {
    let snap: any;

    if (isPin) {
      // Pincode exact match
      snap = await getDocs(query(collection(db, col), where('pincode', '==', cityRaw), limit(50)));
      snap.forEach(addDoc);
    } else {
      // Try cityLower exact
      snap = await getDocs(query(collection(db, col), where('cityLower', '==', cityLow), limit(50)));
      snap.forEach(addDoc);

      // Try city field exact (case-insensitive won't work, try both cases)
      if (results.length === 0) {
        snap = await getDocs(query(collection(db, col), where('city', '==', cityRaw), limit(50)));
        snap.forEach(addDoc);
      }

      // Try title-case variant
      if (results.length === 0) {
        const titleCase = cityRaw.charAt(0).toUpperCase() + cityRaw.slice(1).toLowerCase();
        snap = await getDocs(query(collection(db, col), where('city', '==', titleCase), limit(50)));
        snap.forEach(addDoc);
      }

      // Prefix range query on cityLower
      if (results.length === 0) {
        snap = await getDocs(
          query(
            collection(db, col),
            where('cityLower', '>=', cityLow),
            where('cityLower', '<=', cityLow + '\uf8ff'),
            limit(50)
          )
        );
        snap.forEach(addDoc);
      }

      // GPS fallback: if we have user coords but still empty, fetch ALL and sort by distance
      if (results.length === 0 && userLat !== null && userLng !== null) {
        snap = await getDocs(query(collection(db, col), limit(200)));
        snap.forEach((doc: any) => {
          const d = doc.data();
          const lat = d.lat ?? d.latitude ?? null;
          const lng = d.lng ?? d.longitude ?? null;
          if (lat !== null && lng !== null) {
            const dist = haversine(userLat!, userLng!, lat, lng);
            // Only include sites within 100km radius
            if (dist <= 100) {
              results.push({ id: doc.id, type, dist, lat, lng, ...d } as Site & { dist: number | null });
            }
          }
        });
      }
    }
  } catch (e) {
    console.error(`[RaktPort] Error fetching ${col}:`, e);
  }

  return results;
}

async function fetchSites(
  cityOrPincode: string,
  userLat: number | null,
  userLng: number | null
): Promise<(Site & { dist: number | null })[]> {
  const [banks, camps] = await Promise.all([
    fetchSitesFromCollection('bloodBanks', 'bloodbank', cityOrPincode, userLat, userLng),
    fetchSitesFromCollection('donationCamps', 'camp', cityOrPincode, userLat, userLng),
  ]);

  const results = [...banks, ...camps];

  // Sort nearest → farthest (nulls last), then alphabetically
  results.sort((a, b) => {
    if (a.dist !== null && b.dist !== null) return a.dist - b.dist;
    if (a.dist !== null) return -1;
    if (b.dist !== null) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return results;
}

/* ═══ MAIN COMPONENT ═══════════════════════════════ */
export function LocateDonationSite() {
  const [tab, setTab] = useState<FilterTab>('all');
  const [manualInput, setManualInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [gpsCity, setGpsCity] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [results, setResults] = useState<(Site & { dist: number | null })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  /* ── GPS locate ─────────────────────────────────── */
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    setGpsCity('');
    setResults([]);
    setSearched(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        // Reverse geocode to get city name
        const city = await reverseGeocode(lat, lng);
        setGpsCity(city || 'your location');
        setGpsLoading(false);
        // Always search — use city name if available, otherwise use coords-only fallback
        const searchCity = city || 'nearby';
        setManualInput(city || '');
        // Pass coords directly so GPS fallback (100km radius fetch) works
        await doSearchWithCoords(searchCity, lat, lng);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(
          err.code === 1
            ? 'Location access denied. Please allow location access or enter city manually.'
            : 'Could not get your location. Please try again or enter manually.'
        );
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }, []);

  /* ── Search ─────────────────────────────────────── */
  const doSearchWithCoords = async (term: string, lat: number | null, lng: number | null) => {
    const t = term.trim();
    setError('');
    setLoading(true);
    setSearched(true);
    setSearchTerm(t);
    try {
      const data = await fetchSites(t, lat, lng);
      setResults(data);
      if (data.length === 0) {
        setError(
          lat !== null
            ? 'No donation sites found within 100 km of your location. Try entering a city name manually.'
            : `No donation sites found for "${t}". Try a different city or pincode.`
        );
      }
    } catch {
      setError('Failed to fetch data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const t = manualInput.trim();
    if (!t) { setError('Please enter a city name or 6-digit pincode.'); return; }
    setError('');
    doSearchWithCoords(t, userLat, userLng);
  };

  /* ── Filter ─────────────────────────────────────── */
  const filtered = results.filter((r) => {
    if (tab === 'bloodbank') return r.type === 'bloodbank';
    if (tab === 'camp') return r.type === 'camp';
    return true;
  });
  const bbCount = results.filter((r) => r.type === 'bloodbank').length;
  const campCount = results.filter((r) => r.type === 'camp').length;

  /* ── Maps link ──────────────────────────────────── */
  const mapsLink = (site: Site) => {
    const q = encodeURIComponent(`${site.name}, ${site.address}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  };

  return (
    <>
      <LdsStyles />
      <div className="lds-page">

        {/* ══ HERO ═══════════════════════════════════ */}
        <section className="lds-hero">
          <div className="lds-hero-orb o1" />
          <div className="lds-hero-orb o2" />
          <div className="lds-hero-inner">
            <span className="lds-eyebrow"><span className="lds-dot" />Live Locator</span>
            <h1 className="lds-title">
              Locate <span className="lds-red">Donation</span> Sites
            </h1>
            <p className="lds-sub">
              Find verified blood banks and donation camps near you — powered by real-time data.
            </p>

            {/* ── Search Card ─────────────────────── */}
            <div className="lds-card">
              {/* GPS Row */}
              <button
                className="lds-gps-btn"
                onClick={handleGPS}
                disabled={gpsLoading}
                id="gps-locate-btn"
              >
                {gpsLoading
                  ? <><Loader2 size={16} className="lds-spin" /> Detecting location…</>
                  : <><Navigation size={16} /> Use My Current Location</>
                }
              </button>

              {gpsCity && !gpsLoading && (
                <p className="lds-gps-ok">
                  <CheckCircle2 size={13} /> Detected: <strong>{gpsCity}</strong>
                </p>
              )}
              {gpsError && (
                <p className="lds-gps-err">
                  <AlertCircle size={13} /> {gpsError}
                </p>
              )}

              {/* Divider */}
              <div className="lds-divrow">
                <span className="lds-divline" />
                <span className="lds-divtxt">or enter manually</span>
                <span className="lds-divline" />
              </div>

              {/* Manual input */}
              <div className="lds-input-row">
                <div className="lds-input-wrap">
                  <MapPin size={16} className="lds-input-ico" />
                  <input
                    id="location-input"
                    className="lds-input"
                    type="text"
                    placeholder="City name or 6-digit pincode (e.g. Mumbai or 400001)"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {manualInput && (
                    <button
                      className="lds-clear"
                      onClick={() => { setManualInput(''); setResults([]); setSearched(false); setError(''); }}
                      aria-label="Clear"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  id="search-btn"
                  className="lds-search-btn"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  {loading ? <Loader2 size={16} className="lds-spin" /> : <Search size={16} />}
                  {loading ? 'Searching…' : 'Search'}
                </button>
              </div>

              {error && (
                <p className="lds-form-err">
                  <AlertCircle size={13} /> {error}
                </p>
              )}
            </div>

            {/* Stats pills */}
            <div className="lds-stats">
              {[
                { icon: '🏦', label: 'Blood Banks Indexed' },
                { icon: '📍', label: 'Donation Camps Active' },
                { icon: '🌐', label: 'Cities Covered' },
              ].map((s) => (
                <span key={s.label} className="lds-stat-pill">
                  {s.icon} {s.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══ RESULTS ════════════════════════════════ */}
        {searched && (
          <section className="lds-results-sec">
            <div className="lds-results-inner">

              {/* Header row */}
              <div className="lds-results-hdr">
                <div>
                  <h2 className="lds-results-title">
                    {loading ? 'Searching…' : filtered.length > 0 ? `${filtered.length} Sites Found` : 'No Sites Found'}
                  </h2>
                  {!loading && searchTerm && (
                    <p className="lds-results-sub">near <strong>{searchTerm}</strong></p>
                  )}
                </div>

                {/* Filter tabs */}
                <div className="lds-tabs">
                  <Filter size={13} className="lds-tab-ico" />
                  {([
                    { key: 'all', label: `All (${results.length})`, Icon: Droplets },
                    { key: 'bloodbank', label: `Blood Banks (${bbCount})`, Icon: TestTubes },
                    { key: 'camp', label: `Camps (${campCount})`, Icon: Building2 },
                  ] as { key: FilterTab; label: string; Icon: typeof Droplets }[]).map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      className={`lds-tab${tab === key ? ' on' : ''}`}
                      onClick={() => setTab(key)}
                    >
                      <Icon size={12} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading skeleton */}
              {loading && (
                <div className="lds-skeletons">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="lds-skeleton" />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && filtered.length === 0 && searched && (
                <div className="lds-empty">
                  <div className="lds-empty-ico">🔍</div>
                  <h3 className="lds-empty-title">No sites found</h3>
                  <p className="lds-empty-sub">
                    We couldn't find any{tab === 'bloodbank' ? ' blood banks' : tab === 'camp' ? ' donation camps' : ' donation sites'} matching your search.
                    Try a nearby city or different pincode.
                  </p>
                  {tab !== 'all' && (
                    <button className="lds-empty-btn" onClick={() => setTab('all')}>
                      Show All Types
                    </button>
                  )}
                </div>
              )}

              {/* Result cards */}
              {!loading && filtered.length > 0 && (
                <div className="lds-grid">
                  {filtered.map((site) => {
                    const isBank = site.type === 'bloodbank';
                    const bank = isBank ? (site as BloodBank) : null;
                    const camp = !isBank ? (site as DonationCamp) : null;
                    const km = distLabel(site.dist);
                    return (
                      <div key={site.id} className={`lds-site-card${isBank ? ' bank' : ' camp'}`}>
                        {/* Badge row */}
                        <div className="lds-card-top">
                          <span className={`lds-type-badge${isBank ? ' bank' : ' camp'}`}>
                            {isBank ? <TestTubes size={10} /> : <Building2 size={10} />}
                            {isBank ? 'Blood Bank' : 'Donation Camp'}
                          </span>
                          {isBank && bank?.verified && (
                            <span className="lds-verified">
                              <CheckCircle2 size={10} /> Verified
                            </span>
                          )}
                          {km && (
                            <span className="lds-dist-badge">
                              <MapPin size={9} /> {km}
                            </span>
                          )}
                        </div>

                        {/* Name */}
                        <h3 className="lds-site-name">{site.name}</h3>

                        {/* Address */}
                        <p className="lds-site-addr">
                          <MapPin size={12} /> {site.address}{site.pincode ? `, ${site.pincode}` : ''}
                        </p>

                        {/* Meta */}
                        <div className="lds-site-meta">
                          {isBank && bank?.phone && (
                            <a href={`tel:${bank.phone}`} className="lds-meta-item lds-phone">
                              <Phone size={12} /> {bank.phone}
                            </a>
                          )}
                          {!isBank && camp?.date && (
                            <span className="lds-meta-item">
                              <Calendar size={12} /> {camp.date}
                            </span>
                          )}
                          {!isBank && camp?.organizer && (
                            <span className="lds-meta-item">
                              <Building2 size={12} /> {camp.organizer}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="lds-card-actions">
                          <a
                            href={mapsLink(site)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="lds-dir-btn"
                            id={`directions-${site.id}`}
                          >
                            <ExternalLink size={13} /> Get Directions
                          </a>
                          {isBank && bank?.phone && (
                            <a href={`tel:${bank.phone}`} className="lds-call-btn">
                              <Phone size={13} /> Call
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Disclaimer */}
              {!loading && filtered.length > 0 && (
                <p className="lds-disclaimer">
                  <AlertCircle size={12} /> Results are based on registered records in the RaktPort
                  database. Always call ahead to confirm availability. Emergency: <strong>1800-180-1104</strong>
                </p>
              )}
            </div>
          </section>
        )}

        {/* ══ INFO SECTION (shown before search) ═════ */}
        {!searched && (
          <section className="lds-info-sec">
            <div className="lds-info-inner">
              <h2 className="lds-info-title">How It Works</h2>
              <div className="lds-info-grid">
                {[
                  { n: '01', icon: '📍', title: 'Share Location', desc: 'Allow GPS access or enter your city/pincode to find sites near you.' },
                  { n: '02', icon: '🔍', title: 'We Search Live', desc: 'Our system queries real-time registered blood banks and camps from our national database.' },
                  { n: '03', icon: '🗺️', title: 'Get Directions', desc: 'View sorted results by distance and get one-click directions via Google Maps.' },
                ].map((s) => (
                  <div key={s.n} className="lds-info-card">
                    <div className="lds-info-n">{s.n}</div>
                    <div className="lds-info-emoji">{s.icon}</div>
                    <h3 className="lds-info-ct">{s.title}</h3>
                    <p className="lds-info-cd">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="lds-tip">
                <AlertCircle size={14} />
                <span>
                  <strong>Emergency?</strong> Call the national helpline:{' '}
                  <a href="tel:1800-180-1104" className="lds-tip-link">1800-180-1104</a>{' '}
                  (Free, 24/7)
                </span>
              </div>
            </div>
          </section>
        )}

      </div>
    </>
  );
}

/* ═══ STYLES ══════════════════════════════════════════ */
function LdsStyles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Sora:wght@700;800&display=swap');

/* ── Page Shell ────────────────────────────────── */
.lds-page {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  min-height: 100vh;
  background: var(--rph-bg, #FAF8F8);
  color: var(--rph-t, #130A0C);
}
.dark .lds-page { background: #0f0306; color: #F5F0F1; }

/* ── Hero ──────────────────────────────────────── */
.lds-hero {
  position: relative;
  background: linear-gradient(135deg, #0f0204 0%, #1a0408 40%, #200608 100%);
  padding: 72px 20px 80px;
  overflow: hidden;
}
.lds-hero-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.lds-hero-orb.o1 {
  width: 480px; height: 480px;
  top: -180px; left: -100px;
  background: radial-gradient(circle, rgba(196,30,58,0.18) 0%, transparent 70%);
}
.lds-hero-orb.o2 {
  width: 360px; height: 360px;
  bottom: -100px; right: -80px;
  background: radial-gradient(circle, rgba(196,30,58,0.12) 0%, transparent 70%);
}
.lds-hero-inner {
  max-width: 680px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 1;
}

.lds-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(232,41,74,0.9);
  background: rgba(232,41,74,0.1);
  border: 1px solid rgba(232,41,74,0.22);
  border-radius: 999px;
  padding: 5px 14px;
  margin-bottom: 22px;
}
.lds-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #E8294A;
  animation: lds-pulse 1.6s ease-in-out infinite;
}
@keyframes lds-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(1.4)} }

.lds-title {
  font-family: 'Sora', Georgia, serif;
  font-size: clamp(1.5rem, 4.5vw, 3rem);
  font-weight: 800;
  color: #fff;
  letter-spacing: -.035em;
  line-height: 1;
  margin: 0 0 16px;
  white-space: nowrap;
}
@media (max-width: 500px) {
  .lds-title { font-size: clamp(1.3rem, 7vw, 2rem); white-space: normal; }
}
.lds-red { color: #E8294A; }
.lds-sub {
  color: rgba(255,255,255,0.55);
  font-size: 1rem;
  line-height: 1.7;
  margin: 0 0 36px;
}

/* ── Search Card ───────────────────────────────── */
.lds-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 20px;
  padding: 28px 28px 24px;
  backdrop-filter: blur(16px);
  margin-bottom: 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}

.lds-gps-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 20px;
  border-radius: 12px;
  border: 1.5px solid rgba(196,30,58,0.5);
  background: linear-gradient(135deg, rgba(122,14,30,0.6), rgba(196,30,58,0.35));
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  font-size: .9rem;
  cursor: pointer;
  transition: all .2s;
  margin-bottom: 14px;
}
.lds-gps-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(122,14,30,0.8), rgba(196,30,58,0.55));
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(196,30,58,0.3);
}
.lds-gps-btn:disabled { opacity: .65; cursor: not-allowed; }

.lds-spin { animation: lds-spin .8s linear infinite; }
@keyframes lds-spin { to { transform: rotate(360deg); } }

.lds-gps-ok {
  display: flex; align-items: center; gap: 6px;
  font-size: 12.5px; color: #4ade80; margin: 0 0 10px;
}
.lds-gps-err {
  display: flex; align-items: center; gap: 6px;
  font-size: 12.5px; color: #fca5a5; margin: 0 0 10px;
}

.lds-divrow {
  display: flex; align-items: center; gap: 10px;
  margin: 14px 0;
}
.lds-divline {
  flex: 1; height: 1px;
  background: rgba(255,255,255,0.1);
}
.lds-divtxt {
  font-size: 11px; color: rgba(255,255,255,0.35);
  white-space: nowrap; font-weight: 500;
}

.lds-input-row {
  display: flex; gap: 10px;
}
.lds-input-wrap {
  flex: 1; position: relative; display: flex; align-items: center;
}
.lds-input-ico {
  position: absolute; left: 14px;
  color: rgba(196,30,58,0.7); flex-shrink: 0; pointer-events: none;
}
.lds-input {
  width: 100%;
  padding: 12px 38px 12px 42px;
  border-radius: 10px;
  border: 1.5px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: .9rem;
  outline: none;
  transition: border-color .18s, background .18s;
}
.lds-input::placeholder { color: rgba(255,255,255,0.3); }
.lds-input:focus {
  border-color: rgba(196,30,58,0.6);
  background: rgba(255,255,255,0.09);
}
.lds-clear {
  position: absolute; right: 12px;
  background: none; border: none; padding: 4px;
  color: rgba(255,255,255,0.4); cursor: pointer; line-height: 1;
  border-radius: 50%; transition: color .18s;
}
.lds-clear:hover { color: #fff; }

.lds-search-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 12px 22px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #9B1528, #C41E3A);
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 700; font-size: .88rem;
  cursor: pointer; white-space: nowrap;
  transition: all .2s;
  box-shadow: 0 4px 16px rgba(196,30,58,0.4);
}
.lds-search-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(196,30,58,0.5);
}
.lds-search-btn:disabled { opacity: .65; cursor: not-allowed; }

.lds-form-err {
  display: flex; align-items: center; gap: 6px;
  font-size: 12.5px; color: #fca5a5; margin: 12px 0 0;
}

/* ── Stats pills ───────────────────────────────── */
.lds-stats {
  display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 4px;
}
.lds-stat-pill {
  font-size: 11px; font-weight: 600;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.45);
}

/* ── Results Section ───────────────────────────── */
.lds-results-sec {
  padding: 48px 20px 64px;
  background: var(--rph-bg, #FAF8F8);
}
.dark .lds-results-sec { background: #0f0306; }
.lds-results-inner { max-width: 1020px; margin: 0 auto; }

.lds-results-hdr {
  display: flex; align-items: flex-start;
  justify-content: space-between; flex-wrap: wrap;
  gap: 14px; margin-bottom: 28px;
}
.lds-results-title {
  font-family: 'Sora', serif;
  font-size: 1.6rem; font-weight: 800;
  color: var(--rph-t, #130A0C);
  margin: 0 0 4px;
}
.dark .lds-results-title { color: #F5F0F1; }
.lds-results-sub {
  font-size: 13px; color: #8a7070; margin: 0;
}
.dark .lds-results-sub { color: #907880; }

/* ── Tabs ──────────────────────────────────────── */
.lds-tabs {
  display: flex; align-items: center; gap: 6px;
  flex-wrap: wrap;
}
.lds-tab-ico { color: #8a7070; flex-shrink: 0; }
.lds-tab {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  background: rgba(196,30,58,0.06);
  color: #8a5a60;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .18s;
}
.lds-tab:hover { border-color: rgba(196,30,58,0.3); color: #C41E3A; }
.lds-tab.on {
  background: #C41E3A; color: #fff;
  border-color: #C41E3A;
  box-shadow: 0 2px 10px rgba(196,30,58,0.25);
}
.dark .lds-tab { background: rgba(196,30,58,0.12); color: #c09090; }
.dark .lds-tab.on { background: #C41E3A; color: #fff; }

/* ── Skeleton ──────────────────────────────────── */
.lds-skeletons { display: flex; flex-direction: column; gap: 14px; }
.lds-skeleton {
  height: 140px; border-radius: 14px;
  background: linear-gradient(90deg, rgba(196,30,58,0.07) 25%, rgba(196,30,58,0.12) 50%, rgba(196,30,58,0.07) 75%);
  background-size: 200% 100%;
  animation: lds-shimmer 1.4s infinite;
}
@keyframes lds-shimmer { from{background-position:200% 0} to{background-position:-200% 0} }

/* ── Empty State ───────────────────────────────── */
.lds-empty {
  text-align: center; padding: 64px 24px;
}
.lds-empty-ico { font-size: 3rem; margin-bottom: 16px; }
.lds-empty-title {
  font-size: 1.3rem; font-weight: 700;
  color: var(--rph-t, #130A0C); margin: 0 0 8px;
}
.dark .lds-empty-title { color: #F5F0F1; }
.lds-empty-sub { color: #8a7070; font-size: 14px; max-width: 400px; margin: 0 auto 20px; }
.dark .lds-empty-sub { color: #907880; }
.lds-empty-btn {
  padding: 9px 20px; border-radius: 8px;
  border: 1.5px solid rgba(196,30,58,0.4);
  background: rgba(196,30,58,0.08);
  color: #C41E3A; font-weight: 600; font-size: 13px;
  cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
  transition: all .18s;
}
.lds-empty-btn:hover { background: rgba(196,30,58,0.15); }

/* ── Result Grid ───────────────────────────────── */
.lds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}

/* ── Site Card ─────────────────────────────────── */
.lds-site-card {
  background: #fff;
  border: 1.5px solid #ede8e8;
  border-radius: 16px;
  padding: 20px;
  transition: transform .22s, box-shadow .22s, border-color .22s;
  display: flex; flex-direction: column; gap: 10px;
}
.dark .lds-site-card {
  background: #1a0a0e;
  border-color: rgba(196,30,58,0.18);
}
.lds-site-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(196,30,58,0.1);
  border-color: rgba(196,30,58,0.3);
}
.lds-site-card.bank { border-left: 3px solid #C41E3A; }
.lds-site-card.camp { border-left: 3px solid #7c3aed; }

.lds-card-top {
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
}
.lds-type-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700; letter-spacing: .05em;
  padding: 3px 10px; border-radius: 6px;
  text-transform: uppercase;
}
.lds-type-badge.bank {
  background: rgba(196,30,58,0.1); color: #C41E3A;
  border: 1px solid rgba(196,30,58,0.2);
}
.lds-type-badge.camp {
  background: rgba(124,58,237,0.1); color: #7c3aed;
  border: 1px solid rgba(124,58,237,0.2);
}
.lds-verified {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 600; color: #16a34a;
  padding: 3px 8px; border-radius: 6px;
  background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.2);
}
.lds-dist-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: #6b7280;
  margin-left: auto;
}
.dark .lds-dist-badge { color: #908080; }

.lds-site-name {
  font-size: 1rem; font-weight: 700;
  color: var(--rph-t, #130A0C);
  margin: 0; line-height: 1.3;
}
.dark .lds-site-name { color: #F5F0F1; }

.lds-site-addr {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 12.5px; color: #7a6060; margin: 0; line-height: 1.5;
}
.dark .lds-site-addr { color: #908080; }
.lds-site-addr svg { flex-shrink: 0; margin-top: 2px; color: rgba(196,30,58,0.6); }

.lds-site-meta {
  display: flex; flex-direction: column; gap: 5px;
}
.lds-meta-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #7a6060;
}
.dark .lds-meta-item { color: #908080; }
.lds-phone { text-decoration: none; transition: color .18s; }
.lds-phone:hover { color: #C41E3A; }

.lds-card-actions {
  display: flex; gap: 8px; margin-top: auto; padding-top: 4px;
}
.lds-dir-btn, .lds-call-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12.5px; font-weight: 600;
  text-decoration: none; transition: all .18s;
  cursor: pointer;
}
.lds-dir-btn {
  flex: 1; justify-content: center;
  background: #C41E3A; color: #fff; border: none;
  box-shadow: 0 2px 8px rgba(196,30,58,0.25);
}
.lds-dir-btn:hover {
  background: #9B1528;
  box-shadow: 0 4px 14px rgba(196,30,58,0.35);
  transform: translateY(-1px);
}
.lds-call-btn {
  background: transparent; color: #C41E3A;
  border: 1.5px solid rgba(196,30,58,0.3);
}
.lds-call-btn:hover {
  background: rgba(196,30,58,0.08);
  border-color: #C41E3A;
}

/* ── Disclaimer ────────────────────────────────── */
.lds-disclaimer {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: 12px; color: #9a8a8a; margin-top: 28px;
  padding: 14px 18px; border-radius: 10px;
  background: rgba(196,30,58,0.04);
  border: 1px solid rgba(196,30,58,0.1);
  line-height: 1.6;
}
.dark .lds-disclaimer { color: #908080; background: rgba(196,30,58,0.06); }
.lds-disclaimer svg { flex-shrink: 0; color: rgba(196,30,58,0.6); margin-top: 1px; }

/* ── Info Section ──────────────────────────────── */
.lds-info-sec {
  padding: 56px 20px 72px;
}
.lds-info-inner { max-width: 860px; margin: 0 auto; }
.lds-info-title {
  font-family: 'Sora', serif;
  font-size: 1.8rem; font-weight: 800;
  color: var(--rph-t, #130A0C);
  text-align: center; margin: 0 0 36px;
}
.dark .lds-info-title { color: #F5F0F1; }

.lds-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px; margin-bottom: 32px;
}
.lds-info-card {
  padding: 28px 24px;
  border-radius: 16px;
  background: #fff;
  border: 1.5px solid #ede8e8;
  text-align: center;
  transition: transform .22s, box-shadow .22s;
}
.dark .lds-info-card { background: #1a0a0e; border-color: rgba(196,30,58,0.18); }
.lds-info-card:hover { transform: translateY(-4px); box-shadow: 0 10px 28px rgba(196,30,58,0.1); }
.lds-info-n {
  font-family: 'Sora', serif; font-size: 10px; font-weight: 800;
  letter-spacing: .18em; color: rgba(196,30,58,0.6);
  text-transform: uppercase; margin-bottom: 10px;
}
.lds-info-emoji { font-size: 2rem; margin-bottom: 12px; }
.lds-info-ct {
  font-size: 1rem; font-weight: 700;
  color: var(--rph-t, #130A0C); margin: 0 0 8px;
}
.dark .lds-info-ct { color: #F5F0F1; }
.lds-info-cd { font-size: 13px; color: #7a6060; line-height: 1.6; margin: 0; }
.dark .lds-info-cd { color: #908080; }

.lds-tip {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px; border-radius: 12px;
  background: rgba(196,30,58,0.06);
  border: 1px solid rgba(196,30,58,0.15);
  font-size: 13.5px; color: var(--rph-t, #130A0C);
  line-height: 1.5;
}
.dark .lds-tip { color: #d0b0b0; }
.lds-tip svg { color: #C41E3A; flex-shrink: 0; }
.lds-tip-link { color: #C41E3A; font-weight: 700; }
.lds-tip-link:hover { text-decoration: underline; }

/* ── Responsive ─────────────────────────────────── */
@media (max-width: 600px) {
  .lds-hero { padding: 48px 16px 56px; }
  .lds-card { padding: 20px 16px; }
  .lds-input-row { flex-direction: column; }
  .lds-search-btn { width: 100%; justify-content: center; }
  .lds-results-hdr { flex-direction: column; }
  .lds-grid { grid-template-columns: 1fr; }
}
`}</style>
  );
}
