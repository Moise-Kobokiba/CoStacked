// src/components/auth/NDAModal.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog } from '../shared/Dialog';
import { Button } from '../shared/Button';
import { Checkbox } from '../shared/Checkbox';
import { Shield, FileText, Lock } from 'lucide-react';
import styles from './NDAModal.module.css';

export const NDAModal = ({ onAccept }) => {
  const [agreements, setAgreements] = useState({
    nda: false,
    terms: false,
    privacy: false,
  });

  const allAccepted = agreements.nda && agreements.terms && agreements.privacy;

  const handleAccept = () => {
    if (allAccepted) {
      // Store acceptance timestamps
      localStorage.setItem('ndaAccepted', 'true');
      localStorage.setItem('termsAccepted', 'true');
      localStorage.setItem('privacyAccepted', 'true');
      localStorage.setItem('agreementsAcceptedAt', new Date().toISOString());
      onAccept();
    }
  };

  return (
    <Dialog open={true} className={styles.dialog}>
      <header className={styles.header}>
        <div className={styles.iconWrapper}>
          <Shield size={32} />
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
          <div className={styles.checkboxWrapper}>
            <Checkbox
              id="terms"
              checked={agreements.terms}
              onChange={(e) => setAgreements(prev => ({ ...prev, terms: e.target.checked }))}
            />
            <label htmlFor="terms" className={styles.checkboxLabel}>
              I agree to the <Link to="/terms" target="_blank" className={styles.link}>Terms of Service</Link>
            </label>
          </div>
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
          <div className={styles.checkboxWrapper}>
            <Checkbox
              id="privacy"
              checked={agreements.privacy}
              onChange={(e) => setAgreements(prev => ({ ...prev, privacy: e.target.checked }))}
            />
            <label htmlFor="privacy" className={styles.checkboxLabel}>
              I agree to the <Link to="/privacy" target="_blank" className={styles.link}>Privacy Policy</Link>
            </label>
          </div>
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
          <div className={styles.checkboxWrapper}>
            <Checkbox
              id="nda"
              checked={agreements.nda}
              onChange={(e) => setAgreements(prev => ({ ...prev, nda: e.target.checked }))}
            />
            <label htmlFor="nda" className={styles.checkboxLabel}>
              I agree to the Non-Disclosure Agreement
            </label>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <Button 
          onClick={handleAccept}
          disabled={!allAccepted}
          className={styles.acceptButton}
        >
          Accept All & Continue
        </Button>
        <p className={styles.footerNote}>
          You must accept all agreements to create an account
        </p>
      </footer>
    </Dialog>
  );
};

export default NDAModal;
