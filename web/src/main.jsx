import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <main>
      <h1>🐝 BnBeeHive React TEST</h1>
      <p>React loaded successfully.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
