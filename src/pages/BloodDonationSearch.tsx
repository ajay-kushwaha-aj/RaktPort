/**
 * BloodDonationSearch.tsx
 * RaktPort — SEO-Optimised Blood Donation Search
 *
 * Features:
 *  • URL-driven search (?city=Mumbai&blood=O+&type=donor)
 *  • Helmet-style dynamic <title> / <meta> injection via useEffect
 *  • Schema.org MedicalWebPage + HealthAndBeautyBusiness JSON-LD
 *  • Live Firestore search: donors, blood banks, hospitals
 *  • Blood-group filter, role filter, distance sort
 *  • FAQ accordion for long-tail SEO keywords
 *  • ARIA-labelled, keyboard navigable, mobile-first
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, MapPin, Droplets, Heart, Building2, Navigation,
  Filter, ChevronDown, ChevronUp, Loader2, AlertCircle,
  CheckCircle2, Phone, ExternalLink, X, Users, TestTubes,
  Clock, ArrowRight, RefreshCw, Star, Zap, Shield,
} from 'lucide-react';
import {
  collection, query, where, getDocs, limit, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

/* ─── Blood groups ──────────────────────────────────────────── */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const BLOOD_COMPAT: Record<string, string[]> = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'],
};

/* ─── Types ─────────────────────────────────────────────────── */
type ResultType = 'donor' | 'bloodbank' | 'hospital';

interface SearchResult {
  id: string;
  type: ResultType;
  name: string;
  city: string;
  bloodGroup?: string;
  address?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  status?: string;
  verified?: boolean;
  lastDonation?: string;
  credits?: number;
  dist?: number | null;
  availableUnits?: number;
}

/* ─── Haversine ─────────────────────────────────────────────── */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distLabel(km: number | null | undefined): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/* ─── Reverse Geocode ───────────────────────────────────────── */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Try BigDataCloud (Reliable for localities without restrictive CORS/User-Agent blocks in browser)
  try {
    const r1 = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    if (r1.ok) {
      const d1 = await r1.json();
      const city = d1?.city || d1?.locality || d1?.principalSubdivision;
      if (city && city.trim()) return city.trim();
    }
  } catch {}

  // Fallback to Nominatim OSM
  try {
    const r2 = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (r2.ok) {
      const d2 = await r2.json();
      const addr = d2?.address;
      if (addr) {
        return addr.city || addr.town || addr.municipality || addr.city_district || addr.district || addr.suburb || addr.village || addr.county || addr.state_district || '';
      }
    }
  } catch {}
  
  return '';
}

/* ─── Firestore search ──────────────────────────────────────── */
async function searchFirestore(
  cityOrPin: string,
  bloodGroup: string,
  resultType: string,
  userLat: number | null,
  userLng: number | null,
): Promise<SearchResult[]> {
  const isPin = /^\d{6}$/.test(cityOrPin.trim());
  const cityLow = cityOrPin.trim().toLowerCase();
  const results: SearchResult[] = [];

  const addDonor = (doc: any) => {
    const d = doc.data();
    if (d.role !== 'donor') return;
    if (bloodGroup && bloodGroup !== 'any') {
      const compatible = BLOOD_COMPAT[bloodGroup] || [bloodGroup];
      if (!compatible.includes(d.bloodGroup)) return;
    }
    const lat = d.lat ?? null, lng = d.lng ?? null;
    const dist = userLat != null && userLng != null && lat != null && lng != null
      ? haversine(userLat, userLng, lat, lng) : null;
    results.push({
      id: doc.id, type: 'donor',
      name: d.fullName || 'Anonymous Donor',
      city: d.city || d.district || cityOrPin,
      bloodGroup: d.bloodGroup,
      phone: undefined,           // privacy — never expose donor phone in public search
      lat, lng, dist,
      status: d.status,
      verified: d.isVerified,
      lastDonation: d.lastDonationDate || null,
      credits: d.credits || 0,
    });
  };

  const addBank = (doc: any, type: ResultType) => {
    const d = doc.data();
    if (bloodGroup && bloodGroup !== 'any' && type === 'bloodbank') {
      const inv = d.inventory || d.inventorySetup || {};
      const grp = bloodGroup;
      const avail = inv[grp]?.available ?? inv[grp] ?? null;
      if (avail !== null && avail === 0) return;
    }
    const lat = d.lat ?? null, lng = d.lng ?? null;
    const dist = userLat != null && userLng != null && lat != null && lng != null
      ? haversine(userLat, userLng, lat, lng) : null;
    const inv = d.inventory || d.inventorySetup || {};
    const avail = bloodGroup && inv[bloodGroup] != null
      ? (typeof inv[bloodGroup] === 'object' ? inv[bloodGroup].available : inv[bloodGroup]) : null;
    results.push({
      id: doc.id, type,
      name: d.fullName || d.name || 'Unknown',
      city: d.city || d.district || cityOrPin,
      bloodGroup,
      address: d.address,
      phone: d.phone || d.mobile,
      lat, lng, dist,
      status: d.status,
      verified: d.isVerified ?? d.verified,
      availableUnits: avail ?? undefined,
    });
  };

  const snap = async (col: string, field: string, val: string) => {
    try {
      return await getDocs(query(collection(db, col), where(field, '==', val), limit(60)));
    } catch { return null; }
  };

  // Build all city string variants to try across different field formats
  const titleCase = cityOrPin.trim().charAt(0).toUpperCase() + cityOrPin.trim().slice(1).toLowerCase();
  const cityVariants = isPin
    ? [cityOrPin.trim()]
    : Array.from(new Set([cityLow, titleCase, cityOrPin.trim()]));

  // Try multiple field names and city variants until we get results
  const snapAny = async (col: string, fields: string[], values: string[]) => {
    for (const field of fields) {
      for (const val of values) {
        try {
          const s = await getDocs(query(collection(db, col), where(field, '==', val), limit(60)));
          if (s && !s.empty) return s;
        } catch {}
      }
    }
    return null;
  };

  const cityFields = isPin
    ? ['pincode']
    : ['cityLower', 'city', 'City', 'district', 'state'];

  const fetchFromUsers = async (role: string) => {
    const s = await snapAny('users', cityFields, cityVariants);
    if (s) s.forEach(doc => {
      const d = doc.data();
      if (d.role === role) {
        if (role === 'donor') addDonor(doc);
        else addBank(doc, role as ResultType);
      }
    });
  };

  // Parallel search across collections
  const tasks: Promise<void>[] = [];

  if (resultType === 'all' || resultType === 'donor') {
    tasks.push(fetchFromUsers('donor'));
  }
  if (resultType === 'all' || resultType === 'bloodbank') {
    tasks.push(fetchFromUsers('bloodbank'));
    // also try dedicated bloodBanks collection
    tasks.push((async () => {
      const s = await snapAny('bloodBanks', cityFields, cityVariants);
      if (s) s.forEach(doc => addBank(doc, 'bloodbank'));
    })());
  }
  if (resultType === 'all' || resultType === 'hospital') {
    tasks.push(fetchFromUsers('hospital'));
  }

  await Promise.all(tasks);

  // GPS fallback: if still empty and coords known, fetch all and radius-filter
  if (results.length === 0 && userLat != null && userLng != null) {
    const colMap: Record<string, ResultType> = {
      users: 'donor',    // we'll check role inside
      bloodBanks: 'bloodbank',
    };
    for (const [col, type] of Object.entries(colMap)) {
      try {
        const all = await getDocs(query(collection(db, col), limit(200)));
        all.forEach(doc => {
          const d = doc.data();
          const lat = d.lat ?? null, lng = d.lng ?? null;
          if (lat == null || lng == null) return;
          const dist = haversine(userLat!, userLng!, lat, lng);
          if (dist > 100) return;
          if (col === 'users') {
            if (d.role === 'donor' && (resultType === 'all' || resultType === 'donor')) addDonor(doc);
            if (d.role === 'bloodbank' && (resultType === 'all' || resultType === 'bloodbank')) addBank(doc, 'bloodbank');
            if (d.role === 'hospital' && (resultType === 'all' || resultType === 'hospital')) addBank(doc, 'hospital');
          } else {
            if (resultType === 'all' || resultType === type) addBank(doc, type);
          }
        });
      } catch {}
    }
  }

  // Dedup by id
  const seen = new Set<string>();
  const deduped = results.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  // Sort: nearest first, then verified, then name
  deduped.sort((a, b) => {
    if (a.dist != null && b.dist != null) return a.dist - b.dist;
    if (a.dist != null) return -1;
    if (b.dist != null) return 1;
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return deduped;
}

/* ─── SEO Head injection ────────────────────────────────────── */
// Accepts a "committed" city (set only after search, not on every keystroke)
function useSEOHead(city: string, blood: string, type: string) {
  useEffect(() => {
    const bloodLabel = blood && blood !== 'any' ? ` ${blood}` : '';
    const typeLabel = type && type !== 'all'
      ? (type === 'bloodbank' ? ' Blood Banks' : type === 'hospital' ? ' Hospitals' : ' Donors')
      : '';
    const cityLabel = city ? ` in ${city}` : ' Near You';

    const title = `Find${bloodLabel} Blood${typeLabel}${cityLabel} | RaktPort`;
    const desc = `Search for${bloodLabel} blood${typeLabel.toLowerCase()}${cityLabel}. Find verified donors, blood banks and hospitals on RaktPort — India's unified blood donation platform.`;
    const canonical = `https://raktport.in/search?city=${encodeURIComponent(city)}&blood=${encodeURIComponent(blood)}&type=${encodeURIComponent(type)}`;

    document.title = title;

    const setMeta = (n: string, v: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${n}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, n); document.head.appendChild(el); }
      el.content = v;
    };

    setMeta('description', desc);
    setMeta('keywords', `blood donation${city ? ' ' + city : ''}, donate blood${bloodLabel}, blood bank${cityLabel}, find blood donors India`);
    setMeta('og:title', title, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:url', canonical, 'property');
    setMeta('twitter:title', title, 'name');
    setMeta('twitter:description', desc, 'name');

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalEl) { canonicalEl = document.createElement('link'); canonicalEl.rel = 'canonical'; document.head.appendChild(canonicalEl); }
    canonicalEl.href = canonical;

    // Inject JSON-LD structured data
    const schemaId = 'bds-schema-ld';
    let script = document.getElementById(schemaId) as HTMLScriptElement;
    if (!script) { script = document.createElement('script'); script.id = schemaId; script.type = 'application/ld+json'; document.head.appendChild(script); }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'MedicalWebPage',
      name: title,
      description: desc,
      url: canonical,
      about: { '@type': 'MedicalCause', name: 'Blood Donation' },
      audience: { '@type': 'Patient' },
      publisher: {
        '@type': 'Organization',
        name: 'RaktPort',
        url: 'https://raktport.in',
        logo: 'https://raktport.in/raktport-logo.png',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `https://raktport.in/search?city={city}&blood={blood_group}`,
        'query-input': 'required name=city',
      },
    });

    return () => {
      // Restore defaults on unmount
      document.title = 'RaktPort — Donate Blood Anywhere, Save Everywhere';
      if (script) script.remove();
    };
  }, [city, blood, type]);
}

/* ─── FAQ data (long-tail SEO) ──────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'How do I find a blood donor near me in India?',
    a: 'Use RaktPort\'s search above: enter your city or pincode, select your needed blood group, and choose "Donors". All results are from verified, registered donors across India.',
  },
  {
    q: 'Which blood group is the universal donor?',
    a: 'O- (O negative) is the universal red cell donor as it can be given to patients of any blood type in emergencies. O+ is compatible with all positive blood types.',
  },
  {
    q: 'How often can I donate blood?',
    a: 'Whole blood can be donated every 56 days (8 weeks). Platelets can be donated every 7 days, up to 24 times per year. Always consult your doctor before donating.',
  },
  {
    q: 'What is the eligibility to donate blood in India?',
    a: 'You must be 18–65 years old, weigh at least 45 kg, have hemoglobin ≥12.5 g/dL, and be in good health. You should not have donated blood in the last 90 days.',
  },
  {
    q: 'How do I register as a blood donor on RaktPort?',
    a: 'Click "Sign Up" → select "Donor" → fill your details including blood group and location. Once registered, hospitals and blood banks in your city can find you.',
  },
  {
    q: 'Is there an emergency blood helpline in India?',
    a: 'Yes. The national blood helpline is 1800-180-1104 (toll-free, 24/7). You can also use the RaktPort emergency feature to instantly notify nearby donors.',
  },
];

/* ─── Main Component ─────────────────────────────────────────── */
export function BloodDonationSearch({ onSignupClick }: { onSignupClick?: (role: string) => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search state — synced with URL params
  const [city, setCity]           = useState(searchParams.get('city') || '');
  const [blood, setBlood]         = useState(searchParams.get('blood') || 'any');
  const [resultType, setResultType] = useState(searchParams.get('type') || 'all');
  const [sortBy, setSortBy]       = useState<'distance' | 'verified'>('distance');

  // UI state
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [error, setError]         = useState('');
  const [userLat, setUserLat]     = useState<number | null>(null);
  const [userLng, setUserLng]     = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCity, setGpsCity]     = useState('');
  const [openFaq, setOpenFaq]     = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // committedCity is only set after a search fires — prevents title flickering on every keystroke
  const [committedCity, setCommittedCity] = useState(searchParams.get('city') || '');

  // Inject SEO head tags — uses committed city, not live input value
  useSEOHead(committedCity, blood, resultType);

  // Auto-search if URL already has params
  useEffect(() => {
    const urlCity = searchParams.get('city');
    if (urlCity) {
      setCity(urlCity);
      setBlood(searchParams.get('blood') || 'any');
      setResultType(searchParams.get('type') || 'all');
      doSearch(urlCity, searchParams.get('blood') || 'any', searchParams.get('type') || 'all', null, null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── GPS ──────────────────────────────────────────────────── */
  const handleGPS = useCallback(() => {
    setGpsLoading(true);
    setError('');

    const fallbackToIP = async (errMsg: string) => {
        try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            if (ipData && ipData.city) {
                const cityStr = ipData.city;
                setUserLat(ipData.latitude);
                setUserLng(ipData.longitude);
                setCity(cityStr);
                setGpsCity(cityStr);
                setGpsLoading(false);
                doSearch(cityStr, blood, resultType, ipData.latitude, ipData.longitude);
                return;
            }
        } catch {}
        
        setGpsLoading(false);
        setError(errMsg);
    };

    if (!navigator.geolocation) {
      fallbackToIP('Geolocation not supported. Used IP fallback.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setUserLat(lat); setUserLng(lng);
        const name = await reverseGeocode(lat, lng);
        if (name) { setCity(name); setGpsCity(name); }
        setGpsLoading(false);
        doSearch(name || city, blood, resultType, lat, lng);
      },
      err => {
        fallbackToIP(err.code === 1 ? 'Location access denied. Using IP location.' : 'Could not get high-accuracy location. Using IP fallback.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [city, blood, resultType]); // eslint-disable-line

  /* ── Search ───────────────────────────────────────────────── */
  const doSearch = useCallback(async (
    c: string, bg: string, rt: string,
    lat: number | null, lng: number | null,
  ) => {
    const q = c.trim();
    if (!q && !(lat != null && lng != null)) { 
      setError('Please enter a city name or pincode.'); 
      return; 
    }
    setLoading(true); setError(''); setSearched(true);

    // Commit the city now (for SEO title) — only updates after search, not on each keystroke
    setCommittedCity(q);

    // Update URL params — enables sharing & back-button
    setSearchParams({ city: q, blood: bg, type: rt });

    try {
      const data = await searchFirestore(q, bg, rt, lat ?? userLat, lng ?? userLng);
      setResults(data);
      if (data.length === 0) setError(`No results found for "${q}". Try a different city or blood group.`);
    } catch (e: any) {
      console.error('[BDS] search error:', e);
      setError('Search failed. Check your connection and try again.');
    } finally { setLoading(false); }
  }, [userLat, userLng, setSearchParams]);

  const handleSearch = () => doSearch(city, blood, resultType, userLat, userLng);

  /* ── Sorted results ───────────────────────────────────────── */
  const sorted = [...results].sort((a, b) => {
    if (sortBy === 'distance') {
      if (a.dist != null && b.dist != null) return a.dist - b.dist;
      if (a.dist != null) return -1;
      if (b.dist != null) return 1;
    }
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return 0;
  });

  /* ── Count by type ────────────────────────────────────────── */
  const counts = results.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {} as Record<string, number>);

  /* ── Blood group badge colours ────────────────────────────── */
  const bgColor = (g: string) => {
    if (!g) return 'bg-gray-100 text-gray-600';
    if (g.includes('O')) return 'bg-orange-50 text-orange-700 border border-orange-200';
    if (g.includes('A')) return 'bg-red-50 text-red-700 border border-red-200';
    if (g.includes('B')) return 'bg-blue-50 text-blue-700 border border-blue-200';
    return 'bg-purple-50 text-purple-700 border border-purple-200';
  };

  const typeIcon = (t: ResultType) => {
    if (t === 'donor') return <Heart className="w-4 h-4" />;
    if (t === 'bloodbank') return <TestTubes className="w-4 h-4" />;
    return <Building2 className="w-4 h-4" />;
  };

  const typeLabel = (t: ResultType) =>
    t === 'donor' ? 'Donor' : t === 'bloodbank' ? 'Blood Bank' : 'Hospital';

  const typeColor = (t: ResultType) => {
    if (t === 'donor') return { card: '#fff5f5', badge: '#c41e3a', text: '#9b1528' };
    if (t === 'bloodbank') return { card: '#f0f9ff', badge: '#1d4ed8', text: '#1e40af' };
    return { card: '#f0fdf4', badge: '#15803d', text: '#14532d' };
  };

  return (
    <>
      <BdsStyles />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="bds-hero" aria-labelledby="bds-h1">
        <div className="bds-orb bds-orb1" aria-hidden="true" />
        <div className="bds-orb bds-orb2" aria-hidden="true" />
        <div className="bds-orb bds-orb3" aria-hidden="true" />

        <div className="bds-hero-inner">
          {/* Badge */}
          <div className="bds-eyebrow" role="text">
            <span className="bds-pulse" aria-hidden="true" />
            Live Blood Search · India&apos;s Largest Network
          </div>

          {/* H1 — primary SEO heading */}
          <h1 id="bds-h1" className="bds-h1">
            Find Blood Donors &amp;&nbsp;
            <span className="bds-h1-accent">Blood Banks</span><br />
            Near You — Instantly
          </h1>

          <p className="bds-sub">
            Search across thousands of verified donors, blood banks, and hospitals in your city.
            Enter your location and blood group to get matched in seconds.
          </p>

          {/* ── Search Card ─────────────────────────────────── */}
          <div className="bds-search-card" role="search" aria-label="Blood donation search">
            {/* Row 1: GPS */}
            <button
              id="bds-gps-btn"
              className="bds-gps-btn"
              onClick={handleGPS}
              disabled={gpsLoading}
              aria-busy={gpsLoading}
              aria-label="Use my current location"
            >
              {gpsLoading
                ? <><Loader2 size={15} className="bds-spin" aria-hidden="true" /> Detecting location…</>
                : <><Navigation size={15} aria-hidden="true" /> Use My Current Location</>}
            </button>

            {gpsCity && !gpsLoading && (
              <p className="bds-gps-ok" role="status">
                <CheckCircle2 size={13} aria-hidden="true" />
                Location: <strong>{gpsCity}</strong>
              </p>
            )}

            {/* Divider */}
            <div className="bds-or" aria-hidden="true">
              <span className="bds-or-line" /><span className="bds-or-txt">or search manually</span><span className="bds-or-line" />
            </div>

            {/* Row 2: City input */}
            <div className="bds-input-row">
              <div className="bds-input-wrap">
                <MapPin size={16} className="bds-input-ico" aria-hidden="true" />
                <input
                  ref={inputRef}
                  id="bds-city-input"
                  type="text"
                  className="bds-input"
                  placeholder="City, district or 6-digit pincode…"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  aria-label="Enter city, district or pincode"
                  autoComplete="address-level2"
                />
                {city && (
                  <button
                    className="bds-clear"
                    onClick={() => { setCity(''); setResults([]); setSearched(false); setError(''); inputRef.current?.focus(); }}
                    aria-label="Clear city"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Row 3: Filters */}
            <div className="bds-filters" role="group" aria-label="Search filters">
              {/* Blood group select */}
              <div className="bds-select-wrap">
                <Droplets size={15} className="bds-sel-ico" aria-hidden="true" />
                <select
                  id="bds-blood-select"
                  className="bds-select"
                  value={blood}
                  onChange={e => setBlood(e.target.value)}
                  aria-label="Select blood group"
                >
                  <option value="any">Any Blood Group</option>
                  {BLOOD_GROUPS.map(g => (
                    <option key={g} value={g}>{g} Blood</option>
                  ))}
                </select>
              </div>

              {/* Type select */}
              <div className="bds-select-wrap">
                <Filter size={15} className="bds-sel-ico" aria-hidden="true" />
                <select
                  id="bds-type-select"
                  className="bds-select"
                  value={resultType}
                  onChange={e => setResultType(e.target.value)}
                  aria-label="Select type to search"
                >
                  <option value="all">All (Donors + Banks)</option>
                  <option value="donor">Donors Only</option>
                  <option value="bloodbank">Blood Banks Only</option>
                  <option value="hospital">Hospitals Only</option>
                </select>
              </div>

              {/* Search button */}
              <button
                id="bds-search-btn"
                className="bds-search-btn"
                onClick={handleSearch}
                disabled={loading}
                aria-label="Search for blood"
                aria-busy={loading}
              >
                {loading
                  ? <Loader2 size={16} className="bds-spin" aria-hidden="true" />
                  : <Search size={16} aria-hidden="true" />}
                {loading ? 'Searching…' : 'Search'}
              </button>
            </div>

            {error && !loading && (
              <p className="bds-err" role="alert">
                <AlertCircle size={14} aria-hidden="true" /> {error}
              </p>
            )}
          </div>

          {/* Stats strip */}
          <div className="bds-stats" role="list" aria-label="Platform statistics">
            {[
              { icon: '🩸', label: 'Registered Donors', val: '10,000+' },
              { icon: '🏦', label: 'Blood Banks', val: '500+' },
              { icon: '🌆', label: 'Cities Covered', val: '200+' },
            ].map(s => (
              <div key={s.label} className="bds-stat" role="listitem">
                <span className="bds-stat-val">{s.icon} {s.val}</span>
                <span className="bds-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESULTS ───────────────────────────────────────────── */}
      {searched && (
        <section className="bds-results-sec" aria-live="polite" aria-label="Search results">
          <div className="bds-results-inner">

            {/* Results header */}
            <div className="bds-results-hdr">
              <div>
                <h2 className="bds-results-h2">
                  {loading ? 'Searching…' : results.length > 0
                    ? `${results.length} Result${results.length !== 1 ? 's' : ''} Found`
                    : 'No Results Found'}
                </h2>
                {!loading && city && (
                  <p className="bds-results-sub">
                    {blood !== 'any' && <><span className="bds-blood-tag">{blood}</span> · </>}
                    Near <strong>{city}</strong>
                  </p>
                )}
              </div>

              {/* Sort + Refine */}
              {!loading && results.length > 0 && (
                <div className="bds-sort-row">
                  <label htmlFor="bds-sort" className="bds-sort-lbl">Sort:</label>
                  <select
                    id="bds-sort"
                    className="bds-sort-sel"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    aria-label="Sort results"
                  >
                    <option value="distance">Nearest First</option>
                    <option value="verified">Verified First</option>
                  </select>
                  <button
                    className="bds-refine-btn"
                    onClick={() => { setResults([]); setSearched(false); setError(''); inputRef.current?.focus(); }}
                    aria-label="New search"
                  >
                    <RefreshCw size={13} aria-hidden="true" /> New Search
                  </button>
                </div>
              )}
            </div>

            {/* Type filter tabs */}
            {!loading && results.length > 0 && (
              <div className="bds-type-tabs" role="tablist" aria-label="Filter by type">
                {([
                  { val: 'all', label: `All (${results.length})`, icon: <Droplets size={13} /> },
                  { val: 'donor', label: `Donors (${counts.donor || 0})`, icon: <Heart size={13} /> },
                  { val: 'bloodbank', label: `Blood Banks (${counts.bloodbank || 0})`, icon: <TestTubes size={13} /> },
                  { val: 'hospital', label: `Hospitals (${counts.hospital || 0})`, icon: <Building2 size={13} /> },
                ] as const).map(tab => (
                  <button
                    key={tab.val}
                    role="tab"
                    aria-selected={resultType === tab.val}
                    className={`bds-tab${resultType === tab.val ? ' active' : ''}`}
                    onClick={() => setResultType(tab.val)}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="bds-skeletons" aria-busy="true" aria-label="Loading results">
                {[1, 2, 3, 4].map(i => <div key={i} className="bds-skeleton" />)}
              </div>
            )}

            {/* Empty state */}
            {!loading && searched && sorted.length === 0 && (
              <div className="bds-empty">
                <div className="bds-empty-ico" aria-hidden="true">🔍</div>
                <h3 className="bds-empty-h3">No results found</h3>
                <p className="bds-empty-p">
                  We couldn&apos;t find {blood !== 'any' ? `${blood} blood ` : ''}
                  {resultType !== 'all' ? resultType + 's ' : 'donors or blood banks '}
                  in <strong>{city}</strong>. Try a nearby city or different blood group.
                </p>
                <div className="bds-empty-actions">
                  <button className="bds-try-btn" onClick={() => setBlood('any')}>Remove Blood Filter</button>
                  <button className="bds-try-btn" onClick={() => setResultType('all')}>Show All Types</button>
                </div>
              </div>
            )}

            {/* Result cards */}
            {!loading && sorted.length > 0 && (
              <ol className="bds-results-grid" aria-label="Search results list">
                {sorted.map((r, idx) => {
                  const tc = typeColor(r.type);
                  return (
                    <li key={r.id} className="bds-result-card" style={{ '--card-accent': tc.card } as any}>
                      {/* Card top strip */}
                      <div className="bds-card-top">
                        <span
                          className="bds-type-badge"
                          style={{ background: tc.badge + '18', color: tc.badge, border: `1px solid ${tc.badge}30` }}
                          aria-label={`Type: ${typeLabel(r.type)}`}
                        >
                          {typeIcon(r.type)} {typeLabel(r.type)}
                        </span>
                        {r.verified && (
                          <span className="bds-verified-badge" aria-label="Verified">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        )}
                        {r.dist != null && (
                          <span className="bds-dist-badge" aria-label={`${distLabel(r.dist)} away`}>
                            <MapPin size={10} /> {distLabel(r.dist)} away
                          </span>
                        )}
                        <span className="bds-result-num" aria-label={`Result ${idx + 1}`}>#{idx + 1}</span>
                      </div>

                      {/* Name */}
                      <h3 className="bds-card-name">{r.name}</h3>

                      {/* Blood group + City */}
                      <div className="bds-card-meta">
                        {r.bloodGroup && (
                          <span className={`bds-bg-badge ${bgColor(r.bloodGroup)}`} aria-label={`Blood group: ${r.bloodGroup}`}>
                            <Droplets size={11} aria-hidden="true" /> {r.bloodGroup}
                          </span>
                        )}
                        {r.city && (
                          <span className="bds-city-tag" aria-label={`City: ${r.city}`}>
                            <MapPin size={11} aria-hidden="true" /> {r.city}
                          </span>
                        )}
                        {r.type === 'bloodbank' && r.availableUnits != null && (
                          <span className={`bds-units-tag ${r.availableUnits > 0 ? 'avail' : 'none'}`}>
                            {r.availableUnits > 0
                              ? <><CheckCircle2 size={11} /> {r.availableUnits} units available</>
                              : <><AlertCircle size={11} /> Out of stock</>}
                          </span>
                        )}
                        {r.type === 'donor' && r.credits != null && r.credits > 0 && (
                          <span className="bds-credits-tag">
                            <Star size={11} /> {r.credits} donations
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      {r.address && (
                        <p className="bds-card-addr">
                          <MapPin size={12} aria-hidden="true" /> {r.address}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="bds-card-actions">
                        {(r.type === 'bloodbank' || r.type === 'hospital') && r.phone && (
                          <a
                            href={`tel:${r.phone}`}
                            className="bds-call-btn"
                            aria-label={`Call ${r.name}`}
                            id={`call-${r.id}`}
                          >
                            <Phone size={13} /> Call
                          </a>
                        )}
                        {r.lat != null && r.lng != null && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${r.city || ''}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bds-dir-btn"
                            aria-label={`Get directions to ${r.name}`}
                            id={`dir-${r.id}`}
                          >
                            <ExternalLink size={13} /> Directions
                          </a>
                        )}
                        {r.type === 'donor' && (
                          <button
                            className="bds-contact-btn"
                            onClick={() => onSignupClick?.('donor')}
                            aria-label="Connect with donor — requires login"
                          >
                            <Heart size={13} /> Connect
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* Disclaimer */}
            {!loading && sorted.length > 0 && (
              <p className="bds-disclaimer" role="note">
                <AlertCircle size={13} aria-hidden="true" />
                Results are from verified RaktPort records. Always confirm availability before visiting.
                Emergency helpline: <a href="tel:1800-180-1104" className="bds-helpline">1800-180-1104</a> (24/7, Free)
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── PRE-SEARCH CONTENT (SEO-rich) ────────────────────── */}
      {!searched && (
        <>
          {/* Quick links — popular searches */}
          <section className="bds-popular-sec" aria-labelledby="bds-popular-h2">
            <div className="bds-popular-inner">
              <h2 id="bds-popular-h2" className="bds-section-h2">Popular Searches</h2>
              <p className="bds-section-sub">Quick-start with common blood donation searches across India</p>
              <div className="bds-popular-grid" role="list">
                {[
                  { city: 'Mumbai', blood: 'O+', label: 'O+ Donors in Mumbai' },
                  { city: 'Delhi', blood: 'B+', label: 'B+ Blood in Delhi' },
                  { city: 'Bangalore', blood: 'AB-', label: 'AB- in Bangalore' },
                  { city: 'Chennai', blood: 'A+', label: 'A+ in Chennai' },
                  { city: 'Hyderabad', blood: 'O-', label: 'O- Donors Hyderabad' },
                  { city: 'Kolkata', blood: 'B-', label: 'B- Blood Kolkata' },
                  { city: 'Pune', blood: 'AB+', label: 'AB+ in Pune' },
                  { city: 'Jaipur', blood: 'any', label: 'Blood Banks Jaipur' },
                ].map(s => (
                  <button
                    key={s.label}
                    className="bds-popular-chip"
                    onClick={() => {
                      setCity(s.city);
                      setBlood(s.blood);
                      doSearch(s.city, s.blood, 'all', userLat, userLng);
                    }}
                    role="listitem"
                    aria-label={`Search: ${s.label}`}
                  >
                    <Droplets size={13} aria-hidden="true" />
                    {s.label}
                    <ArrowRight size={12} className="bds-chip-arrow" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="bds-how-sec" aria-labelledby="bds-how-h2">
            <div className="bds-how-inner">
              <h2 id="bds-how-h2" className="bds-section-h2">How the Blood Donation Search Works</h2>
              <p className="bds-section-sub">Three simple steps to find blood in your city</p>
              <div className="bds-how-grid" role="list">
                {[
                  { step: '01', icon: <MapPin className="w-6 h-6" />, title: 'Enter Location', desc: 'Share your city, district or 6-digit pincode. You can also use GPS to auto-detect your location instantly.' },
                  { step: '02', icon: <Droplets className="w-6 h-6" />, title: 'Choose Blood Group', desc: 'Select the required blood group. Our system automatically finds compatible donors using cross-match logic.' },
                  { step: '03', icon: <Zap className="w-6 h-6" />, title: 'Get Matched Instantly', desc: 'View verified donors, blood banks and hospitals sorted by distance. Call or get directions with one tap.' },
                ].map(s => (
                  <article key={s.step} className="bds-how-card" role="listitem">
                    <div className="bds-how-step" aria-hidden="true">{s.step}</div>
                    <div className="bds-how-icon" aria-hidden="true">{s.icon}</div>
                    <h3 className="bds-how-title">{s.title}</h3>
                    <p className="bds-how-desc">{s.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Trust signals */}
          <section className="bds-trust-sec" aria-labelledby="bds-trust-h2">
            <div className="bds-trust-inner">
              <h2 id="bds-trust-h2" className="bds-section-h2">Why Trust RaktPort?</h2>
              <div className="bds-trust-grid" role="list">
                {[
                  { icon: <Shield className="w-5 h-5" />, title: 'Verified Records', desc: 'Every donor and blood bank is identity-verified before appearing in search results.' },
                  { icon: <Zap className="w-5 h-5" />, title: 'Real-Time Data', desc: 'Blood inventory is updated live by blood banks — no stale or outdated information.' },
                  { icon: <Users className="w-5 h-5" />, title: 'Nationwide Coverage', desc: 'Connected across 200+ cities, districts and pincode areas all over India.' },
                  { icon: <Clock className="w-5 h-5" />, title: '24/7 Emergency', desc: 'Emergency helpline 1800-180-1104 always active. Donors can opt-in for urgent alerts.' },
                ].map(t => (
                  <div key={t.title} className="bds-trust-card" role="listitem">
                    <div className="bds-trust-icon" aria-hidden="true">{t.icon}</div>
                    <h3 className="bds-trust-title">{t.title}</h3>
                    <p className="bds-trust-desc">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Emergency CTA */}
          <section className="bds-emergency-sec" aria-label="Emergency blood helpline">
            <div className="bds-emergency-inner">
              <div className="bds-emergency-pulse" aria-hidden="true" />
              <Droplets className="w-8 h-8 text-white mb-3" aria-hidden="true" />
              <h2 className="bds-emergency-h2">Blood Emergency?</h2>
              <p className="bds-emergency-p">
                Call the national blood helpline — available <strong>24 hours, 7 days</strong>, completely free.
              </p>
              <a href="tel:1800-180-1104" className="bds-emergency-btn" aria-label="Call 1800-180-1104 for blood emergency">
                <Phone className="w-5 h-5" aria-hidden="true" />
                Call 1800-180-1104
              </a>
            </div>
          </section>

          {/* FAQ — long-tail SEO */}
          <section className="bds-faq-sec" aria-labelledby="bds-faq-h2">
            <div className="bds-faq-inner">
              <h2 id="bds-faq-h2" className="bds-section-h2">Frequently Asked Questions</h2>
              <p className="bds-section-sub">Everything you need to know about blood donation in India</p>

              {/* Schema.org FAQPage */}
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: FAQ_ITEMS.map(f => ({
                  '@type': 'Question',
                  name: f.q,
                  acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
              })}} />

              <dl className="bds-faq-list">
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} className="bds-faq-item">
                    <dt>
                      <button
                        className="bds-faq-q"
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        aria-expanded={openFaq === i}
                        aria-controls={`faq-ans-${i}`}
                        id={`faq-q-${i}`}
                      >
                        {item.q}
                        {openFaq === i
                          ? <ChevronUp size={18} className="bds-faq-chevron" aria-hidden="true" />
                          : <ChevronDown size={18} className="bds-faq-chevron" aria-hidden="true" />}
                      </button>
                    </dt>
                    <dd
                      id={`faq-ans-${i}`}
                      role="region"
                      aria-labelledby={`faq-q-${i}`}
                      className={`bds-faq-a${openFaq === i ? ' open' : ''}`}
                    >
                      <p>{item.a}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* CTA — register as donor */}
          <section className="bds-cta-sec" aria-label="Register as blood donor">
            <div className="bds-cta-inner">
              <h2 className="bds-cta-h2">Become a Registered Blood Donor</h2>
              <p className="bds-cta-p">
                Join India&apos;s largest network of verified blood donors. Your profile will help hospitals and patients find you when it matters most.
              </p>
              <div className="bds-cta-actions">
                <button
                  className="bds-cta-primary"
                  onClick={() => onSignupClick?.('donor')}
                  id="bds-register-donor-btn"
                  aria-label="Register as blood donor"
                >
                  <Heart className="w-4 h-4" aria-hidden="true" /> Register as Donor
                </button>
                <button
                  className="bds-cta-secondary"
                  onClick={() => onSignupClick?.('bloodbank')}
                  id="bds-register-bank-btn"
                  aria-label="Register blood bank"
                >
                  <Building2 className="w-4 h-4" aria-hidden="true" /> Register Blood Bank
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Inline styles */}
    </>
  );
}

/* ─── Styles Component ──────────────────────────────────────── */
function BdsStyles() {
  return (
    <style>{`
/* ── Base ──────────────────────────────────────────── */
.bds-hero, .bds-results-sec, .bds-popular-sec, .bds-how-sec,
.bds-trust-sec, .bds-emergency-sec, .bds-faq-sec, .bds-cta-sec {
  font-family: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif;
}

/* ── Hero ──────────────────────────────────────────── */
.bds-hero {
  position: relative;
  background: linear-gradient(145deg, #0a0102 0%, #130305 35%, #1c040a 65%, #200608 100%);
  padding: 80px 20px 96px;
  overflow: hidden;
}
.bds-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(60px);
}
.bds-orb1 {
  width: 600px; height: 600px;
  top: -250px; left: -180px;
  background: radial-gradient(circle, rgba(196,30,58,0.22) 0%, transparent 70%);
}
.bds-orb2 {
  width: 400px; height: 400px;
  bottom: -120px; right: -80px;
  background: radial-gradient(circle, rgba(196,30,58,0.14) 0%, transparent 70%);
}
.bds-orb3 {
  width: 300px; height: 300px;
  top: 40%; left: 60%;
  background: radial-gradient(circle, rgba(100,0,20,0.1) 0%, transparent 70%);
  animation: bds-float 8s ease-in-out infinite;
}
@keyframes bds-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-30px)} }

.bds-hero-inner {
  position: relative; z-index: 1;
  max-width: 780px; margin: 0 auto; text-align: center;
}
.bds-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(196,30,58,0.12); border: 1px solid rgba(196,30,58,0.28);
  color: rgba(232,80,100,0.95); border-radius: 99px;
  padding: 6px 18px; font-size: 11px; font-weight: 700;
  letter-spacing: .17em; text-transform: uppercase; margin-bottom: 24px;
}
.bds-pulse {
  width: 7px; height: 7px; border-radius: 50%;
  background: #E8294A;
  box-shadow: 0 0 0 0 rgba(232,41,74,0.6);
  animation: bds-pulse 1.8s ease-in-out infinite;
}
@keyframes bds-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(232,41,74,0.6); }
  70%  { box-shadow: 0 0 0 9px rgba(232,41,74,0); }
  100% { box-shadow: 0 0 0 0 rgba(232,41,74,0); }
}

.bds-h1 {
  font-family: 'Sora', 'Inter', Georgia, serif;
  font-size: clamp(1.7rem, 4.5vw, 3.2rem);
  font-weight: 800; color: #fff;
  letter-spacing: -.04em; line-height: 1.1;
  margin: 0 0 18px;
}
.bds-h1-accent {
  background: linear-gradient(135deg, #E8294A, #FF6B6B);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
.bds-sub {
  color: rgba(255,255,255,0.52); font-size: 1.05rem;
  line-height: 1.75; margin: 0 0 40px;
  max-width: 600px; margin-inline: auto;
}

/* ── Search Card ──────────────────────────────────── */
.bds-search-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 24px; padding: 32px 28px 26px;
  backdrop-filter: blur(20px);
  box-shadow: 0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(196,30,58,0.08);
  margin-bottom: 32px;
}

.bds-gps-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 9px;
  width: 100%; padding: 14px 24px; border-radius: 14px;
  border: 1.5px solid rgba(196,30,58,0.45);
  background: linear-gradient(135deg, rgba(100,0,15,0.7), rgba(196,30,58,0.4));
  color: #fff; font-family: inherit; font-weight: 600; font-size: .9rem;
  cursor: pointer; transition: all .22s; margin-bottom: 16px;
}
.bds-gps-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(100,0,15,0.9), rgba(196,30,58,0.6));
  transform: translateY(-1px); box-shadow: 0 8px 28px rgba(196,30,58,0.35);
}
.bds-gps-btn:disabled { opacity: .55; cursor: not-allowed; }
.bds-spin { animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.bds-gps-ok {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; color: #4ade80; margin: 0 0 12px; font-weight: 500;
}

.bds-or {
  display: flex; align-items: center; gap: 12px; margin: 12px 0 16px;
}
.bds-or-line { flex: 1; height: 1px; background: rgba(255,255,255,0.09); }
.bds-or-txt { font-size: 11.5px; color: rgba(255,255,255,0.3); white-space: nowrap; font-weight: 500; }

.bds-input-row { margin-bottom: 14px; }
.bds-input-wrap { position: relative; display: flex; align-items: center; }
.bds-input-ico {
  position: absolute; left: 15px;
  color: rgba(196,30,58,0.7); pointer-events: none;
}
.bds-input {
  width: 100%; padding: 13px 42px 13px 44px;
  border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.11);
  background: rgba(255,255,255,0.055); color: #fff;
  font-family: inherit; font-size: .92rem; outline: none;
  transition: border-color .18s, background .18s;
}
.bds-input::placeholder { color: rgba(255,255,255,0.28); }
.bds-input:focus {
  border-color: rgba(196,30,58,0.55); background: rgba(255,255,255,0.08);
  box-shadow: 0 0 0 4px rgba(196,30,58,0.08);
}
.bds-clear {
  position: absolute; right: 13px; background: none; border: none;
  color: rgba(255,255,255,0.38); cursor: pointer; padding: 4px;
  border-radius: 50%; line-height: 1; transition: color .15s;
}
.bds-clear:hover { color: #fff; }

.bds-filters {
  display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
}
.bds-select-wrap {
  position: relative; flex: 1; min-width: 160px;
}
.bds-sel-ico {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: rgba(196,30,58,0.65); pointer-events: none;
}
.bds-select {
  width: 100%; padding: 11px 12px 11px 34px;
  border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.11);
  background: rgba(255,255,255,0.06); color: #fff;
  font-family: inherit; font-size: .88rem; outline: none;
  appearance: none; cursor: pointer;
  transition: border-color .18s;
}
.bds-select:focus { border-color: rgba(196,30,58,0.5); }
.bds-select option { background: #1a050a; color: #fff; }

.bds-search-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 28px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, #9B1528, #C41E3A);
  color: #fff; font-family: inherit; font-weight: 700; font-size: .9rem;
  cursor: pointer; white-space: nowrap;
  transition: all .22s; box-shadow: 0 6px 24px rgba(196,30,58,0.45);
}
.bds-search-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7d0f1f, #a81530);
  transform: translateY(-1px); box-shadow: 0 10px 32px rgba(196,30,58,0.55);
}
.bds-search-btn:disabled { opacity: .55; cursor: not-allowed; }

.bds-err {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #fca5a5; margin: 14px 0 0;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
  padding: 10px 14px; border-radius: 10px;
}

/* ── Stats ────────────────────────────────────────── */
.bds-stats {
  display: flex; justify-content: center; gap: 32px; flex-wrap: wrap;
}
.bds-stat {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
}
.bds-stat-val {
  font-weight: 800; font-size: 1.05rem; color: #fff;
}
.bds-stat-lbl {
  font-size: 11.5px; color: rgba(255,255,255,0.38); font-weight: 500;
}

/* ── Results Section ──────────────────────────────── */
.bds-results-sec {
  background: var(--bg-page, #faf8f8);
  padding: 48px 20px 60px;
}
.dark .bds-results-sec { background: #0f0306; }
.bds-results-inner { max-width: 1100px; margin: 0 auto; }
.bds-results-hdr {
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-wrap: wrap; gap: 14px; margin-bottom: 20px;
}
.bds-results-h2 {
  font-size: 1.5rem; font-weight: 800;
  color: var(--text-primary, #130A0C); margin: 0;
}
.dark .bds-results-h2 { color: #f5f0f1; }
.bds-results-sub {
  font-size: 14px; color: var(--text-secondary, #6e6268); margin: 4px 0 0;
}
.dark .bds-results-sub { color: #94a3b8; }
.bds-blood-tag {
  display: inline-block;
  background: rgba(196,30,58,0.1); color: #c41e3a;
  border: 1px solid rgba(196,30,58,0.2);
  border-radius: 99px; padding: 1px 8px;
  font-size: 12px; font-weight: 700;
}

.bds-sort-row {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.bds-sort-lbl { font-size: 13px; font-weight: 600; color: var(--text-secondary, #6e6268); }
.dark .bds-sort-lbl { color: #94a3b8; }
.bds-sort-sel {
  padding: 7px 12px; border-radius: 8px;
  border: 1.5px solid var(--border-color, #e0d6d8);
  background: var(--bg-surface, #fff); color: var(--text-primary, #130A0C);
  font-family: inherit; font-size: 13px; outline: none; cursor: pointer;
}
.dark .bds-sort-sel { background: #1e0a12; border-color: #3d1a24; color: #f5f0f1; }
.bds-refine-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px;
  border: 1.5px solid var(--border-color, #e0d6d8);
  background: var(--bg-surface, #fff); color: var(--text-secondary, #6e6268);
  font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all .18s;
}
.bds-refine-btn:hover {
  border-color: #c41e3a; color: #c41e3a; background: rgba(196,30,58,0.05);
}

/* ── Type Tabs ────────────────────────────────────── */
.bds-type-tabs {
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;
}
.bds-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 99px; font-size: 13px; font-weight: 600;
  border: 1.5px solid var(--border-color, #e0d6d8);
  background: var(--bg-surface, #fff); color: var(--text-secondary, #6e6268);
  cursor: pointer; transition: all .18s; font-family: inherit;
}
.dark .bds-tab { background: #1e0a12; border-color: #3d1a24; color: #94a3b8; }
.bds-tab.active {
  background: #c41e3a; color: #fff; border-color: #c41e3a;
  box-shadow: 0 4px 12px rgba(196,30,58,0.35);
}
.bds-tab:hover:not(.active) { border-color: #c41e3a; color: #c41e3a; }

/* ── Skeletons ─────────────────────────────────────── */
.bds-skeletons { display: grid; grid-template-columns: repeat(auto-fill,minmax(300px,1fr)); gap: 16px; }
.bds-skeleton {
  height: 160px; border-radius: 18px;
  background: linear-gradient(90deg, #f0eded 25%, #e8e2e4 50%, #f0eded 75%);
  background-size: 200% 100%; animation: bds-shimmer 1.4s infinite;
}
.dark .bds-skeleton { background: linear-gradient(90deg,#1e0a12 25%,#2a0e18 50%,#1e0a12 75%); background-size:200% 100%; }
@keyframes bds-shimmer { to { background-position: -200% 0; } }

/* ── Empty ─────────────────────────────────────────── */
.bds-empty {
  text-align: center; padding: 60px 20px;
}
.bds-empty-ico { font-size: 3rem; margin-bottom: 16px; }
.bds-empty-h3 {
  font-size: 1.25rem; font-weight: 700;
  color: var(--text-primary, #130A0C); margin: 0 0 10px;
}
.dark .bds-empty-h3 { color: #f5f0f1; }
.bds-empty-p { font-size: 14px; color: var(--text-secondary, #6e6268); margin: 0 0 20px; }
.dark .bds-empty-p { color: #94a3b8; }
.bds-empty-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.bds-try-btn {
  padding: 8px 18px; border-radius: 20px; font-family: inherit;
  font-size: 13px; font-weight: 600; cursor: pointer;
  border: 1.5px solid #c41e3a; color: #c41e3a; background: rgba(196,30,58,0.05);
  transition: all .18s;
}
.bds-try-btn:hover { background: #c41e3a; color: #fff; }

/* ── Result Grid ──────────────────────────────────── */
.bds-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px; list-style: none; padding: 0; margin: 0;
}
.bds-result-card {
  background: var(--bg-surface, #fff);
  border: 1.5px solid var(--border-color, #e0d6d8);
  border-radius: 20px; padding: 22px;
  transition: all .22s; position: relative;
  overflow: hidden;
}
.dark .bds-result-card { background: #1a050a; border-color: #3d1a24; }
.bds-result-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #c41e3a, #ff6b6b);
  opacity: 0; transition: opacity .22s;
}
.bds-result-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.1);
  border-color: rgba(196,30,58,0.25);
}
.bds-result-card:hover::before { opacity: 1; }
.dark .bds-result-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.4); }

.bds-card-top {
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  margin-bottom: 12px;
}
.bds-type-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 99px;
  font-size: 11px; font-weight: 700;
}
.bds-verified-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 99px;
  background: rgba(15,118,110,0.1); color: #0f766e;
  border: 1px solid rgba(15,118,110,0.2);
  font-size: 11px; font-weight: 700;
}
.bds-dist-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 99px;
  background: #f0f0f0; color: #555;
  font-size: 11px; font-weight: 600;
}
.dark .bds-dist-badge { background: #2a1018; color: #94a3b8; }
.bds-result-num {
  margin-left: auto; font-size: 11px; font-weight: 700;
  color: rgba(196,30,58,0.4);
}

.bds-card-name {
  font-size: 1.05rem; font-weight: 700;
  color: var(--text-primary, #130A0C); margin: 0 0 10px;
  line-height: 1.3;
}
.dark .bds-card-name { color: #f5f0f1; }

.bds-card-meta {
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;
}
.bds-bg-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 99px;
  font-size: 11.5px; font-weight: 700;
}
.bds-city-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 99px;
  background: #f5f5f5; color: #666;
  font-size: 11.5px; font-weight: 500;
}
.dark .bds-city-tag { background: #2a1018; color: #94a3b8; }
.bds-units-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 99px;
  font-size: 11.5px; font-weight: 600;
}
.bds-units-tag.avail { background: rgba(15,118,110,0.08); color: #0f766e; border: 1px solid rgba(15,118,110,0.15); }
.bds-units-tag.none { background: rgba(239,68,68,0.08); color: #dc2626; border: 1px solid rgba(239,68,68,0.15); }
.bds-credits-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 99px;
  background: rgba(180,83,9,0.08); color: #b45309;
  border: 1px solid rgba(180,83,9,0.15);
  font-size: 11.5px; font-weight: 600;
}

.bds-card-addr {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 12.5px; color: var(--text-secondary, #6e6268);
  margin: 0 0 14px; line-height: 1.5;
}
.dark .bds-card-addr { color: #94a3b8; }

.bds-card-actions {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.bds-call-btn, .bds-dir-btn, .bds-contact-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 10px;
  font-family: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all .18s; text-decoration: none;
}
.bds-call-btn {
  background: rgba(15,118,110,0.1); color: #0f766e;
  border: 1.5px solid rgba(15,118,110,0.2);
}
.bds-call-btn:hover { background: #0f766e; color: #fff; }
.bds-dir-btn {
  background: rgba(29,78,216,0.08); color: #1d4ed8;
  border: 1.5px solid rgba(29,78,216,0.15);
}
.bds-dir-btn:hover { background: #1d4ed8; color: #fff; }
.bds-contact-btn {
  background: rgba(196,30,58,0.08); color: #c41e3a;
  border: 1.5px solid rgba(196,30,58,0.2);
}
.bds-contact-btn:hover { background: #c41e3a; color: #fff; }

.bds-disclaimer {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12.5px; color: var(--text-secondary, #6e6268);
  margin: 24px 0 0; padding: 12px 16px;
  background: rgba(0,0,0,0.03); border-radius: 10px;
  line-height: 1.5;
}
.dark .bds-disclaimer { background: rgba(255,255,255,0.04); color: #94a3b8; }
.bds-helpline {
  color: #c41e3a; font-weight: 700; text-decoration: none;
}
.bds-helpline:hover { text-decoration: underline; }

/* ── Pre-search sections ─────────────────────────── */
.bds-section-h2 {
  font-size: 1.6rem; font-weight: 800;
  color: var(--text-primary, #130A0C); text-align: center;
  margin: 0 0 8px;
}
.dark .bds-section-h2 { color: #f5f0f1; }
.bds-section-sub {
  font-size: 14.5px; color: var(--text-secondary, #6e6268);
  text-align: center; margin: 0 0 36px;
}
.dark .bds-section-sub { color: #94a3b8; }

/* Popular */
.bds-popular-sec { background: var(--bg-surface, #fff); padding: 60px 20px; }
.dark .bds-popular-sec { background: #0f0306; }
.bds-popular-inner { max-width: 900px; margin: 0 auto; }
.bds-popular-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.bds-popular-chip {
  display: flex; align-items: center; gap: 9px;
  padding: 13px 16px; border-radius: 14px;
  background: var(--bg-page, #faf8f8);
  border: 1.5px solid var(--border-color, #e0d6d8);
  color: var(--text-primary, #130A0C); font-family: inherit;
  font-size: 13.5px; font-weight: 600; cursor: pointer; text-align: left;
  transition: all .2s;
}
.dark .bds-popular-chip { background: #1a050a; border-color: #3d1a24; color: #f5f0f1; }
.bds-popular-chip:hover {
  border-color: #c41e3a; color: #c41e3a;
  background: rgba(196,30,58,0.05);
  transform: translateY(-2px); box-shadow: 0 6px 20px rgba(196,30,58,0.1);
}
.bds-chip-arrow { margin-left: auto; opacity: 0; transition: opacity .18s; }
.bds-popular-chip:hover .bds-chip-arrow { opacity: 1; }

/* How it works */
.bds-how-sec { background: var(--bg-page, #faf8f8); padding: 60px 20px; }
.dark .bds-how-sec { background: #0f0306; }
.bds-how-inner { max-width: 900px; margin: 0 auto; }
.bds-how-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap: 24px; }
.bds-how-card {
  background: var(--bg-surface, #fff);
  border: 1.5px solid var(--border-color, #e0d6d8);
  border-radius: 20px; padding: 28px; position: relative;
  overflow: hidden; transition: all .22s;
}
.dark .bds-how-card { background: #1a050a; border-color: #3d1a24; }
.bds-how-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.1); }
.dark .bds-how-card:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.4); }
.bds-how-step {
  font-size: 3rem; font-weight: 900; color: rgba(196,30,58,0.07);
  position: absolute; top: 12px; right: 16px; line-height: 1; user-select: none;
}
.bds-how-icon {
  width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(135deg, rgba(196,30,58,0.1), rgba(196,30,58,0.05));
  color: #c41e3a; display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}
.bds-how-title {
  font-size: 1.05rem; font-weight: 700;
  color: var(--text-primary, #130A0C); margin: 0 0 8px;
}
.dark .bds-how-title { color: #f5f0f1; }
.bds-how-desc { font-size: 13.5px; color: var(--text-secondary, #6e6268); line-height: 1.65; margin: 0; }
.dark .bds-how-desc { color: #94a3b8; }

/* Trust */
.bds-trust-sec { background: var(--bg-surface, #fff); padding: 60px 20px; }
.dark .bds-trust-sec { background: #0f0306; }
.bds-trust-inner { max-width: 900px; margin: 0 auto; }
.bds-trust-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 20px; }
.bds-trust-card {
  text-align: center; padding: 28px 20px;
  background: var(--bg-page, #faf8f8);
  border: 1.5px solid var(--border-color, #e0d6d8);
  border-radius: 18px; transition: all .22s;
}
.dark .bds-trust-card { background: #1a050a; border-color: #3d1a24; }
.bds-trust-card:hover {
  border-color: rgba(196,30,58,0.3); box-shadow: 0 8px 28px rgba(196,30,58,0.08);
  transform: translateY(-2px);
}
.bds-trust-icon {
  width: 48px; height: 48px; border-radius: 14px;
  background: rgba(196,30,58,0.08); color: #c41e3a;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
}
.bds-trust-title {
  font-size: 1rem; font-weight: 700;
  color: var(--text-primary, #130A0C); margin: 0 0 8px;
}
.dark .bds-trust-title { color: #f5f0f1; }
.bds-trust-desc { font-size: 13px; color: var(--text-secondary, #6e6268); line-height: 1.6; margin: 0; }
.dark .bds-trust-desc { color: #94a3b8; }

/* Emergency */
.bds-emergency-sec {
  background: linear-gradient(135deg, #8B0000, #c41e3a);
  padding: 60px 20px; text-align: center; position: relative; overflow: hidden;
}
.bds-emergency-inner { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
.bds-emergency-pulse {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 70%);
  animation: bds-float 6s ease-in-out infinite;
}
.bds-emergency-h2 {
  font-size: 2rem; font-weight: 800; color: #fff; margin: 0 0 12px;
}
.bds-emergency-p {
  font-size: 15px; color: rgba(255,255,255,0.8); margin: 0 0 28px; line-height: 1.7;
}
.bds-emergency-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 36px; border-radius: 16px;
  background: #fff; color: #c41e3a;
  font-family: inherit; font-size: 1.1rem; font-weight: 800;
  text-decoration: none; transition: all .22s;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
}
.bds-emergency-btn:hover {
  transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.35);
  background: #fff5f5;
}

/* FAQ */
.bds-faq-sec { background: var(--bg-page, #faf8f8); padding: 60px 20px; }
.dark .bds-faq-sec { background: #0f0306; }
.bds-faq-inner { max-width: 760px; margin: 0 auto; }
.bds-faq-list { margin: 0; display: flex; flex-direction: column; gap: 12px; }
.bds-faq-item {
  background: var(--bg-surface, #fff);
  border: 1.5px solid var(--border-color, #e0d6d8);
  border-radius: 16px; overflow: hidden; transition: border-color .18s;
}
.dark .bds-faq-item { background: #1a050a; border-color: #3d1a24; }
.bds-faq-item:has(.bds-faq-a.open) { border-color: rgba(196,30,58,0.35); }
.bds-faq-q {
  display: flex; justify-content: space-between; align-items: center;
  width: 100%; padding: 18px 22px; background: none; border: none;
  text-align: left; font-family: inherit; font-size: 14.5px; font-weight: 600;
  color: var(--text-primary, #130A0C); cursor: pointer; gap: 12px;
  transition: color .18s;
}
.dark .bds-faq-q { color: #f5f0f1; }
.bds-faq-q:hover { color: #c41e3a; }
.bds-faq-chevron { flex-shrink: 0; color: var(--text-secondary, #6e6268); transition: transform .22s; }
.bds-faq-a {
  max-height: 0; overflow: hidden; transition: max-height .35s ease;
  padding: 0 22px;
}
.bds-faq-a.open { max-height: 300px; padding-bottom: 18px; }
.bds-faq-a p {
  font-size: 14px; color: var(--text-secondary, #6e6268);
  line-height: 1.75; margin: 0;
}
.dark .bds-faq-a p { color: #94a3b8; }

/* CTA */
.bds-cta-sec { background: var(--bg-surface, #fff); padding: 60px 20px; }
.dark .bds-cta-sec { background: #0f0306; }
.bds-cta-inner { max-width: 680px; margin: 0 auto; text-align: center; }
.bds-cta-h2 {
  font-size: 1.8rem; font-weight: 800;
  color: var(--text-primary, #130A0C); margin: 0 0 14px;
}
.dark .bds-cta-h2 { color: #f5f0f1; }
.bds-cta-p {
  font-size: 15px; color: var(--text-secondary, #6e6268);
  line-height: 1.7; margin: 0 0 32px;
}
.dark .bds-cta-p { color: #94a3b8; }
.bds-cta-actions {
  display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
}
.bds-cta-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 32px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #9B1528, #C41E3A);
  color: #fff; font-family: inherit; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all .22s;
  box-shadow: 0 6px 24px rgba(196,30,58,0.4);
}
.bds-cta-primary:hover {
  transform: translateY(-2px); box-shadow: 0 10px 32px rgba(196,30,58,0.5);
}
.bds-cta-secondary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 32px; border-radius: 14px;
  border: 2px solid var(--border-color, #e0d6d8);
  background: var(--bg-page, #faf8f8);
  color: var(--text-primary, #130A0C);
  font-family: inherit; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all .22s;
}
.dark .bds-cta-secondary { background: #1a050a; border-color: #3d1a24; color: #f5f0f1; }
.bds-cta-secondary:hover {
  border-color: #c41e3a; color: #c41e3a; background: rgba(196,30,58,0.05);
  transform: translateY(-2px);
}

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 640px) {
  .bds-hero { padding: 56px 16px 64px; }
  .bds-search-card { padding: 20px 16px; }
  .bds-filters { flex-direction: column; }
  .bds-select-wrap { min-width: 100%; }
  .bds-search-btn { width: 100%; justify-content: center; }
  .bds-results-hdr { flex-direction: column; }
  .bds-stats { gap: 20px; }
  .bds-cta-actions { flex-direction: column; }
  .bds-cta-primary, .bds-cta-secondary { width: 100%; justify-content: center; }
  .bds-popular-grid { grid-template-columns: 1fr 1fr; }
}
`}</style>
  );
}
