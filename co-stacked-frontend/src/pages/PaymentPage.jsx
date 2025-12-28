// src/pages/PaymentPage.jsx

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import API from '../api/axios'; // Ensure we use the configured axios instance
import styles from './PaymentPage.module.css';

export const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { amountInCents, currency, name, description, metadata } = location.state || {};
  
  const [error, setError] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect if someone lands on this page directly
  useEffect(() => {
    if (!amountInCents) {
      navigate('/');
    }
  }, [amountInCents, navigate]);

  const handleCheckout = async () => {
    setIsRedirecting(true);
    setError(null);
    try {
      // Call our backend to create a secure checkout session
      const response = await API.post('/payments/checkout', {
        amountInCents,
        currency,
        metadata: {
            ...metadata,
            description, // Pass description to metadata if useful
            name
        }
      });

      const { redirectUrl } = response.data;

      if (redirectUrl) {
        // Redirect the user to Yoco's secure checkout page
        window.location.href = redirectUrl;
      } else {
        throw new Error('No redirect URL returned from payment provider.');
      }

    } catch (err) {
      console.error('Checkout initialization failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initialize payment.');
      setIsRedirecting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h1 className={styles.title}>{name}</h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.amount}>
          Total: R{(amountInCents / 100).toFixed(2)}
        </div>
        
        {error && (
            <div className={styles.errorContainer}>
                {error}
            </div>
        )}

        <button 
            onClick={handleCheckout} 
            className={styles.payButton} 
            disabled={isRedirecting}
        >
          {isRedirecting ? (
            <>
                <Loader2 className="animate-spin" size={20} style={{marginRight: '8px', display: 'inline'}} />
                Redirecting to Secure Payment...
            </>
          ) : (
            `Pay Securely with Yoco`
          )}
        </button>
        
        <p className={styles.secureNote}>
            You will be redirected to Yoco to complete your payment securely.
        </p>
      </div>
    </div>
  );
};