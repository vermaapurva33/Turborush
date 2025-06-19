import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Redirect to the racing game HTML file
    window.location.href = '/index.html';
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-white text-xl">Loading Turbo Rush...</p>
        <p className="text-gray-400 mt-2">Redirecting to game...</p>
      </div>
    </div>
  );
}

export default App;