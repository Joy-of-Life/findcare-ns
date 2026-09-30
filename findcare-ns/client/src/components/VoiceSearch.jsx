import { useState } from 'react';

const EXAMPLE_PROMPTS = [
  'Find daycare near me',
  'French daycare with open spots',
];

export default function VoiceSearch({ onSearch }) {
  const [listening, setListening]   = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError]           = useState('');

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice search not supported. Please use Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous     = false;
    recognition.interimResults = true;
    recognition.lang           = 'en-CA';
    recognition.onstart  = () => { setListening(true); setError(''); setTranscript(''); };
    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(text);
      if (e.results[0].isFinal) { setListening(false); onSearch({ voiceQuery: text }); }
    };
    recognition.onerror = () => { setListening(false); setError('Could not hear you. Try again.'); };
    recognition.onend   = () => setListening(false);
    recognition.start();
  }

  function simulateVoice(text) {
    setTranscript(text);
    onSearch({ voiceQuery: text });
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span>🎤</span>
        <h2 style={styles.title}>Voice search</h2>
        <span style={styles.badge}>AI powered</span>
      </div>
      <div style={styles.center}>
        <button
          onClick={startListening}
          disabled={listening}
          style={{
            ...styles.micBtn,
            background:  listening ? '#E65100' : '#FF6B35',
            animation:   listening ? 'pulse 1.2s infinite' : 'none',
          }}
          aria-label="Start voice search"
        >
          🎤
        </button>
        <p style={styles.hint}>
          {listening ? 'Listening...' : 'Click to search'}
        </p>
      </div>
      {transcript && (
        <div style={styles.transcriptRow}>
          <div style={styles.transcript}>"{transcript}"</div>
          <button
            type="button"
            onClick={() => setTranscript('')}
            style={styles.clearBtn}
            aria-label="Clear voice search transcript"
            title="Clear voice search transcript"
          >
            ×
          </button>
        </div>
      )}
      {error && <p style={styles.error}>{error}</p>}
      <p style={styles.exampleLabel}>Try saying:</p>
      <div style={styles.chips}>
        {EXAMPLE_PROMPTS.map((prompt, i) => (
          <span key={i} onClick={() => simulateVoice(prompt)} style={styles.chip}>
            "{prompt}"
          </span>
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.4); }
          50%      { box-shadow: 0 0 0 12px rgba(255,107,53,0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrap:        { background: '#FFF3E0', borderRadius: '12px', padding: '14px', textAlign: 'center', border: '1.5px solid #FFCC80', height: '100%' },
  header:      { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', justifyContent: 'center' },
  title:       { fontSize: '14px', fontWeight: '500', color: '#E65100' },
  badge:       { fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: '#FF6B35', color: '#fff', fontWeight: '500' },
  center:      { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' },
  micBtn:      { width: '44px', height: '44px', borderRadius: '50%', border: 'none', fontSize: '18px', color: '#fff', marginBottom: '6px', cursor: 'pointer' },
  hint:        { fontSize: '11px', color: '#E65100' },
  transcriptRow:{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' },
  transcript:  { padding: '6px 10px', background: '#fff', borderRadius: '8px', border: '1px solid #FFCC80', fontSize: '12px', color: '#E65100', marginBottom: '6px' },
  clearBtn:    { border: 'none', background: 'transparent', color: '#E65100', fontSize: '20px', lineHeight: 1, cursor: 'pointer', padding: '2px 5px' },
  error:       { fontSize: '11px', color: '#C62828', marginBottom: '6px' },
  exampleLabel:{ fontSize: '11px', color: '#E65100', marginBottom: '6px' },
  chips:       { display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' },
  chip:        { fontSize: '11px', padding: '3px 8px', borderRadius: '20px', border: '1px solid #FFCC80', background: '#fff', color: '#E65100', cursor: 'pointer' },
};