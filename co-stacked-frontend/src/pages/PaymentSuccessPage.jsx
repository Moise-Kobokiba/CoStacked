// src/pages/PaymentSuccessPage.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '../components/shared/Button';
import styles from './PaymentSuccessPage.module.css';

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  useEffect(() => {
    // Optionally: triggering a re-fetch of user profile here to update badges
    // is a good idea if the webhook has already processed.
    // Since we don't have webhooks yet, we might want to "optimistically" update via an API call here.
    // But per plan, we just show success for now.
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <CheckCircle className={styles.icon} size={64} color="#4caf50" />
        <h1 className={styles.title}>Payment Successful!</h1>
        <p className={styles.message}>
            Thank you for your payment. Your transaction has been completed securely.
        </p>
        
        {type === 'subscription' && (
            <p className={styles.subMessage}>
                Your verification badge is now active.
            </p>
        )}

        <Button onClick={() => navigate('/settings')}>
            Return to Settings
        </Button>
      </div>
    </div>
  );
};
