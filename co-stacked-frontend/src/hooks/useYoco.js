// src/hooks/useYoco.js
import { useState, useEffect } from 'react';

/**
 * A custom hook to load the Yoco SDK script securely and provide the SDK instance.
 * @param {string} publicKey - Your Yoco Public Key
 * @returns {object} - { sdk, loading, error }
 */
export const useYoco = (publicKey) => {
  const [sdk, setSdk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Prevent loading if no key is provided
    if (!publicKey) {
      setError(new Error('Yoco Public Key is required'));
      setLoading(false);
      return;
    }

    // Check if the script is already loaded
    if (window.YocoSDK) {
      setSdk(new window.YocoSDK({ publicKey }));
      setLoading(false);
      return;
    }

    // Check if the script is currently loading to prevent duplicates
    const existingScript = document.querySelector('script[src="https://js.yoco.com/sdk/v1/yoco-sdk-web.js"]');
    
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.YocoSDK) {
          setSdk(new window.YocoSDK({ publicKey }));
          setLoading(false);
        }
      });
      existingScript.addEventListener('error', (err) => {
        setError(err);
        setLoading(false);
      });
      return;
    }

    // Load the Yoco SDK script
    const script = document.createElement('script');
    script.src = 'https://js.yoco.com/sdk/v1/yoco-sdk-web.js';
    script.async = true;

    script.onload = () => {
      if (window.YocoSDK) {
        setSdk(new window.YocoSDK({ publicKey }));
        setLoading(false);
      } else {
        setError(new Error('Yoco SDK failed to initialize'));
        setLoading(false);
      }
    };

    script.onerror = (err) => {
      setError(err);
      setLoading(false);
    };

    document.body.appendChild(script);

    // Cleanup isn't strictly necessary for a global script, but good practice if we were removing it.
    // We leave the script in the body to allow caching/reuse logic above to work.
  }, [publicKey]);

  return { sdk, loading, error };
};
