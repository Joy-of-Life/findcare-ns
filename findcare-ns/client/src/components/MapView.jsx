import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

// Custom colored pin based on availability
function createPin(color, count) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background:${color};
        width:32px;height:32px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="
          transform:rotate(45deg);
          color:#fff;
          font-size:12px;
          font-weight:600;
          font-family:sans-serif;
        ">${count}</span>
      </div>
    `,
    iconSize:   [32, 32],
    iconAnchor: [16, 32],
    popupAnchor:[0, -35],
  });
}

// Pick pin color based on availability
function getPinColor(daycare, ageGroup) {
  if (ageGroup) {
    const spots = daycare.availability?.[ageGroup] || 0;
    if (spots > 0) return '#1D9E75';
    return '#BA7517';
  }
  const total = (daycare.availability?.infant || 0) +
                (daycare.availability?.toddler || 0) +
                (daycare.availability?.preschool || 0);
  if (total > 0) return '#1D9E75';
  if (daycare.language?.includes('French')) return '#534AB7';
  return '#BA7517';
}

function getTotalSpots(daycare) {
  return (daycare.availability?.infant    || 0) +
         (daycare.availability?.toddler   || 0) +
         (daycare.availability?.preschool || 0);
}

export default function MapView({ daycares, ageGroup }) {
  // Centre map on Halifax NS by default
  const centre = [44.6488, -63.5752];

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E8E6E0' }}>
      <MapContainer
        center={centre}
        zoom={10}
        style={{ height: '480px', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {daycares.map(daycare => {
          if (!daycare.coordinates?.lat) return null;
          const color  = getPinColor(daycare, ageGroup);
          const spots  = getTotalSpots(daycare);
          const icon   = createPin(color, spots);

          return (
            <Marker
              key={daycare._id}
              position={[daycare.coordinates.lat, daycare.coordinates.lng]}
              icon={icon}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    {daycare.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                    📍 {daycare.address}, {daycare.city}
                  </p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {daycare.ageRange?.map(age => (
                      <span key={age} style={{
                        fontSize: '11px', padding: '2px 7px',
                        borderRadius: '20px', background: '#E1F5EE', color: '#085041'
                      }}>{age}</span>
                    ))}
                    {daycare.language?.map(lang => (
                      <span key={lang} style={{
                        fontSize: '11px', padding: '2px 7px',
                        borderRadius: '20px', background: '#EEEDFE', color: '#3C3489'
                      }}>{lang}</span>
                    ))}
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '12px', borderTop: '1px solid #F3F4F6', paddingTop: '8px'
                  }}>
                    <span style={{ fontWeight: '500' }}>${daycare.monthlyPrice}/mo</span>
                    <span style={{ color: '#854F0B' }}>★ {daycare.rating}</span>
                    <span style={{ color: spots > 0 ? '#085041' : '#854F0B' }}>
                      {spots > 0 ? `${spots} spots open` : 'Waitlist'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '16px', padding: '10px 14px',
        background: '#F8F7F4', flexWrap: 'wrap'
      }}>
        {[
          { color: '#1D9E75', label: 'Spots available' },
          { color: '#BA7517', label: 'Waitlist only' },
          { color: '#534AB7', label: 'French / bilingual' },
        ].map(item => (
          <span key={item.label} style={{
            display: 'flex', alignItems: 'center',
            gap: '5px', fontSize: '12px', color: '#6B7280'
          }}>
            <span style={{
              width: '10px', height: '10px',
              borderRadius: '50%', background: item.color,
              display: 'inline-block'
            }}></span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}