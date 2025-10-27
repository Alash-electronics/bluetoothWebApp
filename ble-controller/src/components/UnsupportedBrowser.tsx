export const UnsupportedBrowser = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
        <div className="mb-6">
          <svg className="w-20 h-20 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-white text-2xl font-bold mb-4">
          {isIOS ? 'iOS Not Supported' : 'Browser Not Supported'}
        </h1>

        <p className="text-gray-300 mb-6">
          {isIOS ? (
            <>
              Unfortunately, iOS devices do not support Web Bluetooth API.
              This application requires Bluetooth communication to function.
            </>
          ) : isSafari ? (
            <>
              Safari does not support Web Bluetooth API.
              Please use Chrome, Edge, or Opera browser.
            </>
          ) : (
            <>
              Your browser does not support Web Bluetooth API.
              Please use Chrome, Edge, or Opera browser.
            </>
          )}
        </p>

        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <h2 className="text-cyan-400 font-semibold mb-2">Supported Browsers:</h2>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>✓ Chrome (Desktop & Android)</li>
            <li>✓ Edge (Desktop)</li>
            <li>✓ Opera (Desktop & Android)</li>
          </ul>
        </div>

        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <h2 className="text-yellow-400 font-semibold mb-2">Not Supported:</h2>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>✗ iOS (iPhone, iPad)</li>
            <li>✗ Safari (all platforms)</li>
            <li>✗ Firefox</li>
          </ul>
        </div>

        {isIOS && (
          <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-4 mb-6">
            <p className="text-cyan-300 text-sm">
              <strong>Tip:</strong> Use an Android device or Desktop computer with Chrome browser to access this application.
            </p>
          </div>
        )}

        <a
          href="https://github.com/Alash-electronics/bluetoothWebApp"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          View on GitHub
        </a>

        <p className="text-gray-500 text-xs mt-6">
          BLE Controller v1.0.0 by Alash Electronics
        </p>
      </div>
    </div>
  );
};
