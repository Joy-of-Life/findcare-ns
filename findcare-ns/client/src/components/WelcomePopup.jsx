import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WelcomePopup() {
  const [show, setShow] = useState(false);
  const [daycareCount, setDaycareCount] = useState(0);
  const navigate        = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const seen = sessionStorage.getItem('welcomeSeen');
    if (!seen) setTimeout(() => setShow(true), 800);
  }, []);

  useEffect(() => {
    async function fetchDaycareCount() {
      try {
        const res = await fetch(`${API_URL}/api/daycares`);
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : 0;
        setDaycareCount(count);
      } catch (err) {
        console.error('Error fetching daycare count:', err);
        setDaycareCount(0);
      }
    }
    fetchDaycareCount();
  }, [API_URL]);

  function handleOwner() {
    sessionStorage.setItem('welcomeSeen', 'true');
    setShow(false);
    navigate('/register');
  }

  function handleParent() {
    sessionStorage.setItem('welcomeSeen', 'true');
    setShow(false);
  }

  if (!show) return null;

  return (
    <>
      <div style={styles.backdrop} onClick={handleParent} />
      <div style={styles.popup}>
        <button onClick={handleParent} style={styles.closeBtn}>✕</button>

        {/* Balloon tags */}
        <div style={styles.balloons}>
          <span style={{...styles.balloon, background:'#FFF3E0', color:'#E65100', border:'1px solid #FFCC80'}}>🎈 Nova Scotia</span>
          <span style={{...styles.balloon, background:'#E3F2FD', color:'#1565C0', border:'1px solid #90CAF9'}}>⭐ Licensed centers</span>
          <span style={{...styles.balloon, background:'#F3E5F5', color:'#6A1B9A', border:'1px solid #CE93D8'}}>💜 Real-time spots</span>
        </div>

        <h2 style={styles.heading}>Finding the perfect daycare just got easier!</h2>
        <p style={styles.subheading}>Nova Scotia families, we're here for you.</p>
        <p style={styles.description}>
          FindCare NS connects Nova Scotia parents with licensed daycare centres.
          Search by city, age group, language and availability — all in one place.
        </p>

        {/* Feature cards */}
        <div style={styles.featureGrid}>
          {[
            { icon: '🏫', title: 'Licensed centres',  desc: 'All types welcomed'    },
            { icon: '🔔', title: 'Spot alerts',        desc: 'Get notified instantly' },
            { icon: '🗺️', title: 'Interactive map',    desc: 'Find daycares nearby'  },
          ].map(f => (
            <div key={f.title} style={styles.featureCard}>
              <div style={styles.featureIcon}>{f.icon}</div>
              <div style={styles.featureTitle}>{f.title}</div>
              <div style={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { value: daycareCount > 0 ? `${daycareCount}+` : '0+',   label: 'Daycares listed'  },
            { value: 'NS',   label: 'Nova Scotia only'  },
            { value: '24/7', label: 'Always available'  },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <span style={styles.statValue}>{s.value}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={styles.btnRow}>
          <button onClick={handleOwner} style={styles.btnPrimary}>🏫 List your daycare →</button>
          <button onClick={handleParent} style={styles.btnSecondary}>I'm a parent, continue</button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity:0; transform:translate(-50%,-48%) scale(0.96); }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
      `}</style>
    </>
  );
}

const styles = {
  backdrop:     { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:300 },
  popup:        { position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'95%', maxWidth:'680px', maxHeight:'92vh', overflowY:'auto', background:'#fff', borderRadius:'24px', padding:'40px 32px', zIndex:301, animation:'popIn 0.3s ease', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  closeBtn:     { position:'absolute', top:'16px', right:'16px', width:'32px', height:'32px', borderRadius:'50%', border:'1px solid #E8E6E0', background:'#F8F7F4', fontSize:'16px', color:'#6B7280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'600' },
  balloons:     { display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px', justifyContent:'center' },
  balloon:      { fontSize:'12px', fontWeight:'600', padding:'4px 12px', borderRadius:'20px' },
  heading:      { fontSize:'28px', fontWeight:'700', color:'#1F2937', lineHeight:'1.2', marginBottom:'8px', whiteSpace:'nowrap', textAlign:'center', fontFamily:'Recoleta, serif' },
  subheading:   { fontSize:'18px', fontWeight:'600', color:'#FF6B35', marginBottom:'16px', textAlign:'center' },
  description:  { fontSize:'15px', color:'#6B7280', lineHeight:'1.7', marginBottom:'28px', textAlign:'center' },
  featureGrid:  { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:'14px', marginBottom:'24px' },
  featureCard:  { border:'2px solid #FFE0B2', borderRadius:'14px', padding:'14px 12px', textAlign:'center', background:'#FFFBF5' },
  featureIcon:  { fontSize:'28px', marginBottom:'6px' },
  featureTitle: { fontSize:'13px', fontWeight:'600', color:'#1F2937' },
  featureDesc:  { fontSize:'12px', color:'#9E9E9E', marginTop:'3px' },
  statsRow:     { display:'flex', justifyContent:'space-around', background:'linear-gradient(135deg, #FFF8E1, #FFF3E0)', borderRadius:'14px', padding:'20px', marginBottom:'24px', border:'1px solid #FFE0B2' },
  statValue:    { display:'block', fontSize:'24px', fontWeight:'800', color:'#FF6B35' },
  statLabel:    { display:'block', fontSize:'11px', color:'#6B7280', marginTop:'4px', fontWeight:'500' },
  btnRow:       { display:'flex', gap:'12px', flexWrap:'wrap' },
  btnPrimary:   { flex:1, padding:'14px 20px', borderRadius:'12px', border:'none', background:'#FF6B35', color:'#fff', fontSize:'15px', fontWeight:'700', cursor:'pointer', minWidth:'140px', boxShadow:'0 6px 20px rgba(255, 107, 53, 0.25)' },
  btnSecondary: { flex:1, padding:'14px 20px', borderRadius:'12px', border:'2px solid #FFE0B2', background:'#fff', color:'#1F2937', fontSize:'15px', fontWeight:'600', cursor:'pointer', minWidth:'140px' },
};