import React, { useState, useMemo } from 'react';
import { MapPin, Search, AlertTriangle, Droplet } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export const CityInventory: React.FC = () => {
  const { cityInventory } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Extract cities and apply search filter
  const allCities = useMemo(() => Object.keys(cityInventory).sort(), [cityInventory]);
  
  const filteredCities = useMemo(() => {
    if (!searchTerm.trim()) return allCities;
    const q = searchTerm.toLowerCase();
    return allCities.filter(c => c.toLowerCase().includes(q));
  }, [allCities, searchTerm]);

  const getStockColor = (units: number) => {
    if (units >= 20) return '#4ade80';
    if (units >= 5) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'Inter, sans-serif' }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <MapPin size={22} color="#f472b6" /> Regional Inventory
        </h2>
        <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
          Breakdown of blood stock levels isolated by district and city geometry.
        </p>
      </div>

      {/* ── Search Bar ── */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 24 }}>
        <Search size={16} color="#6a5a5d" style={{ position: 'absolute', left: 16, top: 13 }} />
        <input 
          type="text" 
          placeholder="Search for a city or region..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%', padding: '11px 16px 11px 42px',
            background: '#0f0a0b', border: '1px solid #2e1a1e', borderRadius: 8,
            color: '#f0e0e4', fontSize: 13, outline: 'none'
          }}
        />
      </div>

      {/* ── City List ── */}
      {filteredCities.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6a5a5d', background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 12 }}>
          No regions found matching your criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredCities.map(city => {
            const data = cityInventory[city];
            const cityTotal = data.reduce((acc, curr) => acc + curr.units, 0);
            const criticals = data.filter(i => i.units < 5 && i.units > 0);

            return (
              <div key={city} style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f0e0e4', margin: 0 }}>{city}</h3>
                    <span style={{ background: '#1a1012', color: '#a09094', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      Total Units: {cityTotal}
                    </span>
                    {criticals.length > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(248,113,113,0.1)', color: '#f87171', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        <AlertTriangle size={12} /> Needs {criticals.map(c => c.bloodGroup).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                  {data.map(item => (
                    <div key={item.bloodGroup} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#140c0e', border: '1px solid #2e1a1e', borderRadius: 8, padding: '12px 16px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Droplet size={14} color={getStockColor(item.units)} />
                        <span style={{ color: '#c0b0b3', fontWeight: 600, fontSize: 14 }}>{item.bloodGroup}</span>
                      </div>
                      <span style={{ color: item.units === 0 ? '#6a5a5d' : '#f0e0e4', fontWeight: 800, fontSize: 16 }}>
                        {item.units}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CityInventory;
