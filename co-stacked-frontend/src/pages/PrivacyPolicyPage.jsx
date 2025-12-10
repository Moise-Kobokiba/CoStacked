// src/pages/PrivacyPolicyPage.jsx

import styles from './LegalPage.module.css';

export const PrivacyPolicyPage = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>Privacy Policy for CoStacked</h1>
          <p>Last Updated: December 10, 2025</p>
        </header>

        <section>
          <h2>1. Introduction</h2>
          <p>Welcome to CoStacked ("we," "our," "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this privacy policy carefully. If you do not agree with the terms, do not access the site.</p>
        </section>

        <section>
          <h2>2. Collection of Your Information</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
          <ul>
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, that you voluntarily give to us when you register with the Site or sign in using OAuth providers.</li>
            <li><strong>OAuth Authentication Data:</strong> When you sign in using GitHub, Google, or LinkedIn, we collect your name, email address, profile picture, and other publicly available profile information from these services. We do not store your passwords from these services.</li>
            <li><strong>Profile Data:</strong> Information you provide for your user profile, such as your bio, skills, location, availability, portfolio links, and avatar. This information is displayed publicly to facilitate connections.</li>
            <li><strong>Project Data:</strong> Information and content you post for project listings, including titles, descriptions, and required skills. This content is considered public.</li>
            <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, browser type, and the dates and times you access the Site.</li>
            <li><strong>Connection Data:</strong> Information about your connections with other users, messages, and project interests.</li>
          </ul>
        </section>

        <section>
          <h2>3. Third-Party OAuth Providers</h2>
          <p>We use third-party OAuth providers to facilitate account creation and authentication:</p>
          <ul>
            <li><strong>GitHub:</strong> We collect your GitHub profile information including name, email, and avatar.</li>
            <li><strong>Google:</strong> We collect your Google profile information including name, email, and profile picture.</li>
            <li><strong>LinkedIn:</strong> We collect your LinkedIn profile information including name, email, and profile picture.</li>
          </ul>
          <p>These services have their own privacy policies governing how they handle your data. We recommend reviewing:</p>
          <ul>
            <li><a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub Privacy Policy</a></li>
            <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
            <li><a href="https://www.linkedin.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">LinkedIn Privacy Policy</a></li>
          </ul>
        </section>

        <section>
          <h2>4. Use of Your Information</h2>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
          <ul>
            <li>Create and manage your account.</li>
            <li>Authenticate your identity when you sign in.</li>
            <li>Facilitate connections between founders and developers.</li>
            <li>Display your profile and project information to other users.</li>
            <li>Email you regarding your account or project interactions.</li>
            <li>Send you notifications about connections, messages, and project interests.</li>
            <li>Monitor and analyze usage and trends to improve your experience.</li>
            <li>Resolve disputes and troubleshoot problems.</li>
            <li>Prevent fraudulent transactions and protect against criminal activity.</li>
          </ul>
        </section>

        <section>
          <h2>5. Disclosure of Your Information</h2>
          <p>We do not share your personal information with third parties except as described in this policy. We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
          <ul>
            <li><strong>Publicly on the Platform:</strong> Your profile information (name, bio, skills, etc.) and project details are visible to other users of the platform to enable the core functionality of CoStacked.</li>
            <li><strong>With Your Consent:</strong> We may disclose your information for any other purpose with your consent.</li>
            <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, we may share your information as permitted or required by any applicable law.</li>
          </ul>
        </section>
        
        <section>
          <h2>6. Data Retention</h2>
          <p>We will retain your information for as long as your account is active or as needed to provide you services. If you wish to delete your account, please contact us. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.</p>
        </section>

        <section>
          <h2>7. Security of Your Information</h2>
          <p>We use administrative, technical, and physical security measures to help protect your personal information. We use industry-standard encryption for data transmission and storage. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.</p>
        </section>

        <section>
          <h2>8. Your Data Rights</h2>
          <p>Depending on your location, you may have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Access:</strong> You can request access to the personal information we hold about you.</li>
            <li><strong>Correction:</strong> You can update your profile information at any time through your account settings.</li>
            <li><strong>Deletion:</strong> You can request deletion of your account and associated data.</li>
            <li><strong>Data Portability:</strong> You can request a copy of your data in a machine-readable format.</li>
          </ul>
          <p>To exercise these rights, please contact us at privacy@costacked.com</p>
        </section>

        <section>
          <h2>9. Children's Privacy</h2>
          <p>Our Service is not intended for children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you become aware that a child has provided us with personal information, please contact us.</p>
        </section>

        <section>
          <h2>10. Changes to This Privacy Policy</h2>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>
        </section>

        <section>
          <h2>11. Contact Us</h2>
          <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
          <p><strong>Email:</strong> privacy@costacked.com</p>
        </section>
      </div>
    </div>
  );
};