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
        <span style={styles.micIcon}>🎤</span>
        <h2 style={styles.title}>Voice search</h2>
        <span style={styles.badge}>AI powered</span>
      </div>
      <div style={styles.center}>
        <button
          onClick={startListening}
          disabled={listening}
          style={{ ...styles.micBtn, background: listening ? '#085041' : '#1D9E75' }}
          aria-label="Start voice search"
        >
          🎤
        </button>
        <p style={styles.hint}>
          {listening ? 'Listening...' : 'Click to search'}
        </p>
      </div>
      {transcript && (
        <div style={styles.transcript}>"{transcript}"</div>
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
    </div>
  );
}

const styles = {
  wrap:        { background: '#E1F5EE', borderRadius: '12px', padding: '14px', textAlign: 'center' },
  header:      { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', justifyContent: 'center' },
  micIcon:     { fontSize: '16px' },
  title:       { fontSize: '14px', fontWeight: '500', color: '#085041' },
  badge:       { fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: '#0F6E56', color: '#fff', fontWeight: '500' },
  center:      { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' },
  micBtn:      { width: '44px', height: '44px', borderRadius: '50%', border: 'none', fontSize: '18px', color: '#fff', marginBottom: '6px', cursor: 'pointer' },
  hint:        { fontSize: '11px', color: '#085041' },
  transcript:  { padding: '6px 10px', background: '#fff', borderRadius: '8px', border: '1px solid #5DCAA5', fontSize: '12px', color: '#085041', marginBottom: '6px' },
  error:       { fontSize: '11px', color: '#A32D2D', marginBottom: '6px' },
  exampleLabel:{ fontSize: '11px', color: '#085041', marginBottom: '6px' },
  chips:       { display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' },
  chip:        { fontSize: '11px', padding: '3px 8px', borderRadius: '20px', border: '1px solid #5DCAA5', background: '#fff', color: '#085041', cursor: 'pointer' },
};