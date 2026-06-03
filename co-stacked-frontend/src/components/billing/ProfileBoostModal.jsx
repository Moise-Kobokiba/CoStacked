// src/components/billing/ProfileBoostModal.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { Dialog } from '../shared/Dialog';
import { Button } from '../shared/Button';
import { PricingCard } from './PricingCard';
import styles from './BoostModal.module.css';
import PropTypes from 'prop-types';

const boostOptions = [
  { id: '3d', title: '3 Days', price: 'R100', amountInCents: 10000 },
  { id: '5d', title: '5 Days', price: 'R250', amountInCents: 25000 },
  { id: '7d', title: '1 Week', price: 'R350', amountInCents: 35000 },
];

/**
 * A modal for selecting a profile boost tier.
 * It no longer handles the payment logic directly.
 */
export const ProfileBoostModal = ({ user, open, onClose }) => {
  const navigate = useNavigate(); // 2. Initialize the navigate function
  const [selectedTier, setSelectedTier] = useState(boostOptions[1].id); // Default to R250 tier

  const handleProceedToPayment = () => {
    const chosenOption = boostOptions.find(opt => opt.id === selectedTier);
    
    if (!chosenOption) return; // Safety check

    // 3. Navigate to the new dedicated payment page, passing all necessary
    //    data in the navigation state.
    navigate('/payment', {
      state: {
        amountInCents: chosenOption.amountInCents,
        currency: 'ZAR',
        name: 'Boost Your Profile',
        description: `Feature your profile for ${chosenOption.title}`,
        // Metadata our backend needs to verify the payment correctly
        metadata: {
          tierId: selectedTier,
          type: 'profile_boost', // Explicit type for backend verification
          successPath: '/profile', // Where to redirect after a successful payment
          failurePath: '/profile'  // Where to redirect after a failed/canceled payment
        },
        // A simple string to tell our PaymentPage which Redux action to dispatch
        action: 'profileBoost'
      }
    });
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <header className={styles.header}>
        <h1 className={styles.title}>Boost Your Profile</h1>
        <p className={styles.subtitle}>Feature your profile on the "Find Talent" page to get noticed by founders.</p>
      </header>
      <div className={styles.tiers}>
        {boostOptions.map(option => (
          <PricingCard
            key={option.id}
            title={option.title}
            price={option.price}
            selected={selectedTier === option.id}
            onSelect={() => setSelectedTier(option.id)}
          />
        ))}
      </div>
      <footer className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleProceedToPayment}>Proceed to Payment</Button>
      </footer>
    </Dialog>
  );
};

ProfileBoostModal.propTypes = {
  user: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};