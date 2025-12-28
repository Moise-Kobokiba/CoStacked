// src/pages/PaymentSuccessPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/shared/Button';
import API from '../api/axios';
import { verifySubscription } from '../features/payments/paymentSlice'; // Import action if needed, or dispatch manual update
// Ideally we dispatch an action that updates the user in redux. 
// For now, let's fetch the updated profile or just manually update if the slice supports it.
// Assuming we need to refresh the user profile to get the new 'isVerified' status.

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
        // If no ID, maybe they refreshed or came here directly. 
        // We can't verify, but if they are here from Yoco, it might be fine.
        // But to be safe, show a generic success or warning.
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
            // Clear the ID
            localStorage.removeItem('pendingCheckoutId');
            
            // Dispatch/Update User State here if needed. 
            // Since the backend updated the user, we should probably reload the user profile
            // to ensure the frontend has the latest 'isVerified' flag.
            window.location.reload(); // Simple way to force refresh of user data on next app load, 
            // OR ideally: dispatch(fetchUserProfile()); 
            // For now, next time they navigate or refresh, it updates.
        } else {
            throw new Error(response.data.message || 'Verification failed');
        }

      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage('Could not verify payment status automatically. Please check your settings.');
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
