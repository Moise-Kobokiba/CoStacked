// src/pages/PaymentSuccessPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/shared/Button';
import API from '../api/axios';
import { setUser } from '../features/auth/authSlice';
import styles from './PaymentSuccessPage.module.css';

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyTransaction = async () => {
      const checkoutId = localStorage.getItem('pendingCheckoutId');
      
      if (!checkoutId) {
        // If no ID, but user is here, assume success (or they refreshed after success)
        setStatus('success'); 
        setMessage('Payment Completed.');
        return;
      }

      try {
        // Call backend to verify
        const response = await API.post('/payments/verify-checkout', { checkoutId });
        
        if (response.data.success) {
            setStatus('success');
            setMessage(response.data.message);
            localStorage.removeItem('pendingCheckoutId');
            
            if (response.data.user) {
                dispatch(setUser(response.data.user));
            }
        } else {
            // Throw with the backend's message so it's caught below
            throw new Error(response.data.message || 'Verification failed');
        }

      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        // Show the actual error message from backend if possible
        setMessage(err.message || 'Could not verify payment status automatically.');
      }
    };

    verifyTransaction();
  }, [dispatch]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        
        {status === 'verifying' && (
            <>
                <Loader2 className={`animate-spin ${styles.icon}`} size={64} color="#2196f3" />
                <h1 className={styles.title}>Verifying Payment...</h1>
                <p className={styles.message}>Please wait while we confirm your transaction.</p>
            </>
        )}

        {status === 'success' && (
            <>
                <CheckCircle className={styles.icon} size={64} color="#4caf50" />
                <h1 className={styles.title}>Payment Successful!</h1>
                <p className={styles.message}>
                    {message}
                </p>
                {type === 'subscription' && (
                    <p className={styles.subMessage}>
                        Your verification badge is now active.
                    </p>
                )}
                <Button onClick={() => navigate('/settings')}>
                    Return to Settings
                </Button>
            </>
        )}

        {status === 'error' && (
            <>
                <AlertCircle className={styles.icon} size={64} color="#f44336" />
                <h1 className={styles.title}>Verification Issue</h1>
                <p className={styles.message}>
                    {message}
                </p>
                <p className={styles.subMessage}>
                    If you were charged, your subscription will be active shortly. Contact support if issues persist.
                </p>
                <Button variant="secondary" onClick={() => navigate('/settings')}>
                    Return to Settings
                </Button>
            </>
        )}

      </div>
    </div>
  );
};
