// src/components/billing/SubscriptionModal.jsx

import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { Dialog } from '../shared/Dialog';
import { Button } from '../shared/Button';
import { CheckCircle } from 'lucide-react';
import styles from './SubscriptionModal.module.css';
import PropTypes from 'prop-types';

const PRICE_IN_CENTS = 20000; // R200.00

/**
 * A modal for confirming a user's subscription choice before payment.
 */
export const SubscriptionModal = ({ open, onClose }) => {
  const navigate = useNavigate(); // 2. Initialize the navigate function

  const handleProceedToPayment = () => {
    // 3. Navigate to the dedicated payment page, passing subscription details.
    navigate('/payment', {
      state: {
        amountInCents: PRICE_IN_CENTS,
        currency: 'ZAR',
        name: 'Co-Stacked Verified Subscription',
        description: 'Monthly subscription for a verified user badge.',
        // Metadata for our backend to know what's being paid for.
        metadata: {
          successPath: '/settings', // Redirect back to settings on success
          failurePath: '/settings',  // Redirect back to settings on failure
          type: 'subscription' // Added type here for backend (Yoco metadata)
        },
        // A string to tell our PaymentPage which Redux action to dispatch (Legacy - kept for safety if needed later)
        action: 'subscription'
      }
    });
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <header className={styles.header}>
        <CheckCircle size={40} className={styles.icon} />
        <h1 className={styles.title}>Confirm Your Subscription</h1>
        <p className={styles.subtitle}>You are about to subscribe to the Co-Stacked Verified plan.</p>
      </header>
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span>Plan</span>
          <strong>Verified User</strong>
        </div>
        <div className={styles.summaryItem}>
          <span>Price</span>
          <strong>R200 / month</strong>
        </div>
      </div>
      <footer className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        {/* The button now navigates instead of handling payment directly */}
        <Button onClick={handleProceedToPayment}>Confirm & Pay</Button>
      </footer>
    </Dialog>
  );
};

// The 'onConfirm' prop is no longer needed as the payment logic has moved.
SubscriptionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};