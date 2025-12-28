// src/pages/PaymentCancelPage.jsx
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '../components/shared/Button';
import styles from './PaymentSuccessPage.module.css'; // Reuse styles

export const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <XCircle className={styles.icon} size={64} color="#f44336" />
        <h1 className={styles.title}>Payment Cancelled</h1>
        <p className={styles.message}>
            You have cancelled the payment process. No charges were made.
        </p>
        
        <Button variant="secondary" onClick={() => navigate('/settings')}>
            Return to Settings
        </Button>
      </div>
    </div>
  );
};
