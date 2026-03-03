import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Lock, X } from 'lucide-react';
import { Button } from '../shared/Button';
import { Checkbox } from '../shared/Checkbox';
import styles from './NDAModal.module.css';

export const NDAModal = ({ onAccept, onClose }) => {
  const [agreements, setAgreements] = useState({
    nda: false,
    terms: false,
    privacy: false,
  });
  const [isActive, setIsActive] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const modalRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    // Trigger entrance animation
    setIsActive(true);
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setIsActive(false);
    
    // Allow exit animation to complete
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  const allAccepted = agreements.nda && agreements.terms && agreements.privacy;
  const acceptedCount = Object.values(agreements).filter(Boolean).length;
  const progressPercentage = (acceptedCount / 3) * 100;

  const handleCheckboxChange = (key, checked) => {
    console.log(`Checkbox ${key} changed to:`, checked);
    setAgreements(prev => {
      const newState = { ...prev, [key]: checked };
      console.log('New agreements state:', newState);
      return newState;
    });
  };

  const handleAccept = () => {
    console.log('Accept button clicked. allAccepted:', allAccepted);
    if (allAccepted) {
      // Store acceptance timestamps
      localStorage.setItem('ndaAccepted', 'true');
      localStorage.setItem('termsAccepted', 'true');
      localStorage.setItem('privacyAccepted', 'true');
      localStorage.setItem('agreementsAcceptedAt', new Date().toISOString());
      
      // Trigger exit animation before calling onAccept
      handleClose();
      
      // Call onAccept after animation
      setTimeout(() => {
        onAccept();
      }, 300);
    }
  };

  return (
    <div 
      ref={overlayRef}
      className={`${styles.overlay} ${isActive ? styles.active : ''} ${isExiting ? styles.exiting : ''}`}
    >
      <div className={styles.modalContainer} ref={modalRef}>
        <button 
          className={styles.closeButton} 
          onClick={handleClose}
          aria-label="Close modal"
          title="Close (Esc)"
        >
          <X size={18} />
        </button>
        
        <div className={styles.modalContent}>
          {/* Progress indicator */}
          <div className={styles.progressContainer}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>

          <header className={styles.header}>
            <div className={styles.iconWrapper}>
              <Shield size={36} />
            </div>
            <h1 className={styles.title}>Before You Join</h1>
            <p className={styles.description}>
              Please review and accept the following agreements to proceed with registration.
            </p>
          </header>

          <div className={styles.content}>
            {/* Terms of Service */}
            <div className={styles.agreementCard}>
              <div className={styles.agreementHeader}>
                <FileText size={20} className={styles.agreementIcon} />
                <h3 className={styles.agreementTitle}>Terms of Service</h3>
              </div>
              <p className={styles.agreementText}>
                By using CoStacked, you agree to our Terms of Service which outline your rights 
                and responsibilities when using the platform.
              </p>
              <label htmlFor="terms" className={styles.checkboxRow}>
                <Checkbox
                  id="terms"
                  checked={agreements.terms}
                  onChange={(e) => handleCheckboxChange('terms', e.target.checked)}
                />
                <span className={styles.checkboxText}>
                  I agree to the <Link to="/terms" target="_blank" className={styles.link} onClick={(e) => e.stopPropagation()}>Terms of Service</Link>
                </span>
              </label>
            </div>

            {/* Privacy Policy */}
            <div className={styles.agreementCard}>
              <div className={styles.agreementHeader}>
                <Lock size={20} className={styles.agreementIcon} />
                <h3 className={styles.agreementTitle}>Privacy Policy</h3>
              </div>
              <p className={styles.agreementText}>
                We take your privacy seriously. Our Privacy Policy explains how we collect, 
                use, and protect your personal information.
              </p>
              <label htmlFor="privacy" className={styles.checkboxRow}>
                <Checkbox
                  id="privacy"
                  checked={agreements.privacy}
                  onChange={(e) => handleCheckboxChange('privacy', e.target.checked)}
                />
                <span className={styles.checkboxText}>
                  I agree to the <Link to="/privacy" target="_blank" className={styles.link} onClick={(e) => e.stopPropagation()}>Privacy Policy</Link>
                </span>
              </label>
            </div>

            {/* NDA Agreement */}
            <div className={styles.agreementCard}>
              <div className={styles.agreementHeader}>
                <Shield size={20} className={styles.agreementIcon} />
                <h3 className={styles.agreementTitle}>Non-Disclosure Agreement (NDA)</h3>
              </div>
              <div className={styles.ndaContent}>
                <p>
                  This Non-Disclosure Agreement (the "Agreement") is made and entered into by and between 
                  CoStacked ("Company") and you ("Recipient").
                </p>
                <p>
                  <strong>1. Confidential Information.</strong> "Confidential Information" means any and all 
                  information disclosed by Company to Recipient which ought to be treated as confidential. 
                  This includes, but is not limited to, project ideas, business plans, and technical data 
                  shared on the platform.
                </p>
                <p>
                  <strong>2. Non-Disclosure.</strong> Recipient agrees not to disclose or use any Confidential 
                  Information for any purpose other than for evaluating and potentially participating in 
                  projects on the CoStacked platform.
                </p>
                <p>
                  <strong>3. Duration.</strong> This agreement remains in effect for as long as you use the 
                  platform and for 2 years thereafter.
                </p>
              </div>
              <label htmlFor="nda" className={styles.checkboxRow}>
                <Checkbox
                  id="nda"
                  checked={agreements.nda}
                  onChange={(e) => handleCheckboxChange('nda', e.target.checked)}
                />
                <span className={styles.checkboxText}>
                  I agree to the Non-Disclosure Agreement
                </span>
              </label>
            </div>
          </div>

          <footer className={styles.footer}>
            <Button 
              onClick={handleAccept}
              disabled={!allAccepted}
              className={styles.acceptButton}
            >
              Accept All & Continue {acceptedCount > 0 && `(${acceptedCount}/3)`}
            </Button>
            <p className={styles.footerNote}>
              You must accept all three agreements to create an account
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default NDAModal;