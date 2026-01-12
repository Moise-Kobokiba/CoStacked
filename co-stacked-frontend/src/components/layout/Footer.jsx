// src/components/layout/Footer.jsx

import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext'; // 1. Import the theme hook

// 2. Import BOTH logos using the correct, case-sensitive paths
import logoLight from '../../assets/logo-light.png';
import logoDark from '../../assets/logo-dark.png';
import styles from "./Footer.module.css";

import { SocialLinks } from '../shared/SocialLinks'; // Import SocialLinks

// ... existing imports ...

export const Footer = () => {
  const { theme } = useTheme(); // 3. Get the current theme from the context

  // 4. Conditionally select the correct logo source based on the current theme
  const logoSrc = theme === 'light' ? logoLight : logoDark;

  const currentYear = new Date().getFullYear();

  // Social media links
  const socialLinks = {
    instagram: "https://www.instagram.com/costacked",
    twitter: "https://x.com/costacked",
    linkedin: "https://www.linkedin.com/company/costacked/",
    tiktok: "https://www.tiktok.com/@costacked_official",
    youtube: "https://youtube.com/@costacked",
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* === Left Side: Logo and Tagline === */}
        <div className={styles.brandSection}>
          <Link to="/" className={styles.logoContainer}>
            {/* 5. Use the dynamic logoSrc variable here */}
            <img src={logoSrc} alt="CoStacked Logo" className={styles.logoImage} />
            <span className={styles.logoText}>CoStacked</span>
          </Link>
          <p className={styles.tagline}>
            Where great ideas meet great developers.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <SocialLinks socials={socialLinks} />
          </div>
        </div>

        {/* === Right Side: Link Columns === */}
        <div className={styles.linksSection}>
          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>Platform</h4>
            <Link to="/projects" className={styles.link}>Discover Projects</Link>
            <Link to="/users" className={styles.link}>Find Talent</Link>
            <Link to="/post-project" className={styles.link}>Post a Project</Link>
          </div>
          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>Company</h4>
            <Link to="/about" className={styles.link}>About Us</Link>
            <Link to="/support" className={styles.link}>Support</Link>
          </div>
          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>Legal</h4>
            <Link to="/privacy" className={styles.link}>Privacy Policy</Link>
            <Link to="/terms" className={styles.link}>Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* === Bottom Bar: Copyright === */}
      <div className={styles.bottomBar}>
        <p>&copy; {currentYear} CoStacked. All Rights Reserved. (2025/880389/07)</p>
      </div>
    </footer>
  );
};