// src/components/billing/YocoPayment.jsx

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';
import { useYoco } from '../../hooks/useYoco'; // Verified path imports the new file
import styles from './YocoPayment.module.css';

export const YocoPayment = ({ publicKey, amountInCents, currency = 'ZAR', name, description, onPaymentResult }) => {
  // --- 2. USE the hook to get the SDK instance and its loading state ---
  const { sdk: yocoSDK, loading: sdkLoading, error: sdkError } = useYoco(publicKey);

  useEffect(() => {
    // This effect runs only when the yocoSDK instance becomes available from the hook.
    // This completely eliminates the race condition.
    if (yocoSDK) {
      yocoSDK.inline({
        layout: 'card',
        amountInCents,
        currency,
        name,
        description,
        callback: (result) => {
          // Pass the result (success or error) up to the parent PaymentPage.
          onPaymentResult(result);
        }
      });
    }
  }, [yocoSDK, amountInCents, currency, name, description, onPaymentResult]);

  // If the script fails to load for any reason, show an error.
  if (sdkError) {
    return <div className={styles.errorContainer}>Error loading payment provider. Please try again later.</div>;
  }

  return (
    <div className={styles.container}>
      {/* Show a loader while the useYoco hook is fetching the script */}
      {sdkLoading && (
        <div className={styles.loaderContainer}>
          <Loader2 className="animate-spin" />
          <p>Initializing secure payment...</p>
        </div>
      )}
      {/* The form will be invisible until the SDK has loaded and mounted it */}
      <div id="card-frame" style={{ visibility: sdkLoading ? 'hidden' : 'visible' }}></div>
    </div>
  );
};

YocoPayment.propTypes = {
  publicKey: PropTypes.string.isRequired,
  amountInCents: PropTypes.number.isRequired,
  currency: PropTypes.string,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onPaymentResult: PropTypes.func.isRequired,
};