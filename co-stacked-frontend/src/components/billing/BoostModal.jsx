// src/components/billing/BoostModal.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { Dialog } from '../shared/Dialog';
import { Button } from '../shared/Button';
import { PricingCard } from './PricingCard';
import styles from './BoostModal.module.css';
import PropTypes from 'prop-types';

const boostOptions = [
  { id: '3d', title: '3 Days', price: 'R100', amountInCents: 10000 },
  { id: '5d', title: '5 Days', price: 'R200', amountInCents: 20000 },
  { id: '7d', title: '1 Week', price: 'R350', amountInCents: 35000 },
];

/**
 * A modal for selecting a project boost tier.
 * It no longer handles the payment logic directly.
 */
export const BoostModal = ({ project, open, onClose }) => {
  const navigate = useNavigate(); // 2. Initialize the navigate function
  const [selectedTier, setSelectedTier] = useState(boostOptions[0].id);

  const handleProceedToPayment = () => {
    const chosenOption = boostOptions.find(opt => opt.id === selectedTier);
    if (!project || !chosenOption) return;

    // 3. Navigate to the dedicated payment page, passing all necessary data.
    navigate('/payment', {
      state: {
        amountInCents: chosenOption.amountInCents,
        currency: 'ZAR',
        name: `Boost: ${project.title}`,
        description: `Boost project for ${chosenOption.title}`,
        // Metadata our backend needs to verify the payment correctly
        metadata: {
          projectId: project._id,
          tierId: selectedTier,
          type: 'project_boost', // Explicit type for backend verification
          successPath: '/dashboard', // Where to redirect after a successful payment
          failurePath: '/dashboard'  // Where to redirect after a failed/canceled payment
        },
        // A simple string to tell our PaymentPage which Redux action to dispatch
        action: 'projectBoost'
      }
    });
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <header className={styles.header}>
        <h1 className={styles.title}>Boost Your Project</h1>
        <p className={styles.subtitle}>Feature "<strong>{project.title}</strong>" on the Discover page to attract more talent.</p>
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

BoostModal.propTypes = {
  project: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};