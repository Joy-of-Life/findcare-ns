import { useState } from 'react';

const EXAMPLE_PROMPTS = [
  'Find daycare near me',
  'I need infant care in Halifax',
  'Show bilingual daycare options',
  'French daycare with open spots',
];

export default function VoiceSearch({ onSearch }) {
  const [listening, setListening]     = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [error, setError]             = useState('');

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice search is not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous     = false;
    recognition.interimResults = true;
    recognition.lang           = 'en-CA';

    recognition.onstart = () => {
      setListening(true);
      setError('');
      setTranscript('');
    };

    recognition.onresult = (e) => {
      const text = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setTranscript(text);

      if (e.results[0].isFinal) {
        setListening(false);
        onSearch({ voiceQuery: text });
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setError('Could not hear you. Please try again.');
    };

    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function simulateVoice(text) {
    setTranscript(text);
    onSearch({ voiceQuery: text });
  }

  return (
    <div style={styles.wrap}>

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.micIcon}>🎤</span>
        <h2 style={styles.title}>Voice search</h2>
        <span style={styles.badge}>AI powered</span>
      </div>

      {/* Mic button */}
      <div style={styles.center}>
        <button
          onClick={startListening}
          disabled={listening}
          style={{
            ...styles.micBtn,
            background: listening ? '#085041' : '#1D9E75',
            animation:  listening ? 'pulse 1.2s infinite' : 'none',
          }}
        >
          🎤
        </button>
        <p style={styles.hint}>
          {listening ? 'Listening... speak now' : 'Click to start voice search'}
        </p>
      </div>

      {/* Transcript */}
      {transcript && (
        <div style={styles.transcript}>
          <strong>You said:</strong> "{transcript}"
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={styles.error}>{error}</p>
      )}

      {/* Example prompts */}
      <p style={styles.exampleLabel}>Try saying things like:</p>
      <div style={styles.chips}>
        {EXAMPLE_PROMPTS.map((prompt, i) => (
          <span
            key={i}
            onClick={() => simulateVoice(prompt)}
            style={styles.chip}
          >
            "{prompt}"
          </span>
        ))}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(29,158,117,0.4); }
          50%       { box-shadow: 0 0 0 16px rgba(29,158,117,0); }
        }
      `}</style>

    </div>
  );
}

const styles = {
  wrap: {
    background:   '#E1F5EE',
    borderRadius: '16px',
    padding:      '24px',
    marginBottom: '16px',
    textAlign:    'center',
  },
  header: {
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    marginBottom: '20px',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: '20px',
  },
  title: {
    fontSize:   '18px',
    fontWeight: '500',
    color:      '#085041',
  },
  badge: {
    fontSize:     '11px',
    padding:      '2px 8px',
    borderRadius: '20px',
    background:   '#0F6E56',
    color:        '#fff',
    fontWeight:   '500',
  },
  center: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    marginBottom:   '16px',
  },
  micBtn: {
    width:        '72px',
    height:       '72px',
    borderRadius: '50%',
    border:       'none',
    fontSize:     '28px',
    color:        '#fff',
    marginBottom: '12px',
    transition:   'transform 0.15s',
  },
  hint: {
    fontSize: '13px',
    color:    '#085041',
  },
  transcript: {
    margin:       '0 auto 16px',
    padding:      '10px 14px',
    background:   '#fff',
    borderRadius: '10px',
    border:       '1px solid #5DCAA5',
    fontSize:     '13px',
    color:        '#085041',
    maxWidth:     '500px',
  },
  error: {
    fontSize:     '13px',
    color:        '#A32D2D',
    marginBottom: '12px',
  },
  exampleLabel: {
    fontSize:     '12px',
    color:        '#085041',
    marginBottom: '8px',
  },
  chips: {
    display:        'flex',
    gap:            '6px',
    flexWrap:       'wrap',
    justifyContent: 'center',
  },
  chip: {
    fontSize:     '12px',
    padding:      '5px 10px',
    borderRadius: '20px',
    border:       '1px solid #5DCAA5',
    background:   '#fff',
    color:        '#085041',
    cursor:       'pointer',
  },
};
