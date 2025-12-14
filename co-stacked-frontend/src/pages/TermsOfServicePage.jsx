// src/pages/TermsOfServicePage.jsx

import styles from './LegalPage.module.css';

export const TermsOfServicePage = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>Terms of Service</h1>
          <p>Last Updated: December 10, 2025</p>
        </header>

        <section>
          <h2>1. Agreement to Terms</h2>
          <p>By using the CoStacked platform ("Site", "Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service. These terms apply to all visitors, users, and others who access or use the Service.</p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>CoStacked provides a platform for individuals ("Founders") to post summaries of their project ideas and for other individuals ("Developers") to connect with them for potential collaboration. We are a platform for facilitating connections and are not a party to any agreement entered into between users.</p>
        </section>
        
        <section>
          <h2>3. User Accounts</h2>
          <p>To access most features of the Site, you must register for an account. You may register using:</p>
          <ul>
            <li>Email and password</li>
            <li>GitHub OAuth authentication</li>
            <li>Google OAuth authentication</li>
            <li>LinkedIn OAuth authentication</li>
          </ul>
          <p>When you register, you agree to provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password that you use to access the Service (if using email/password authentication) and for any activities or actions under your account.</p>
          <p>If you use OAuth authentication, you agree to comply with the terms of service of the respective OAuth provider (GitHub, Google, or LinkedIn).</p>
        </section>
        
        <section>
          <h2>4. User Content and Conduct</h2>
          <p>You are solely responsible for the content you post, including project descriptions, profile information, and messages ("User Content"). You agree not to post User Content that is:</p>
          <ul>
            <li>Unlawful, harmful, threatening, abusive, harassing, or otherwise objectionable</li>
            <li>Fraudulent, false, misleading, or deceptive</li>
            <li>Invasive of another's privacy or violates any third-party rights</li>
            <li>Contains software viruses or any other malicious code</li>
            <li>Spam or unsolicited promotional content</li>
          </ul>
          <p>You grant CoStacked a worldwide, non-exclusive, royalty-free license to use, reproduce, and display the User Content solely for the purposes of operating and providing the Service.</p>
        </section>
        
        <section>
          <h2>5. Intellectual Property</h2>
          <p>CoStacked is a platform for sharing ideas. When you connect with another user, you may be exposed to their confidential information. The <strong>Non-Disclosure Agreement (NDA)</strong> presented before you connect governs the confidentiality of this information.</p>
          <p>CoStacked does not claim ownership rights in the project ideas or content you post. The intellectual property of projects remains with the original Founder or as agreed between collaborating parties.</p>
          <p>The CoStacked platform itself, including its design, features, and functionality, is owned by Co-Stacked and is protected by copyright, trademark, and other intellectual property laws.</p>
        </section>

        <section>
          <h2>6. Third-Party Services</h2>
          <p>Our Service uses third-party OAuth providers (GitHub, Google, LinkedIn) for authentication. Your use of these services is subject to their respective terms of service and privacy policies. We are not responsible for the practices of these third-party services.</p>
        </section>

        <section>
          <h2>7. Prohibited Uses</h2>
          <p>You may not use the Service:</p>
          <ul>
            <li>In any way that violates any applicable law or regulation</li>
            <li>To impersonate or attempt to impersonate another user or person</li>
            <li>To harass, abuse, or harm another person</li>
            <li>To collect or track personal information of other users without consent</li>
            <li>To spam, phish, or send unsolicited messages</li>
            <li>To interfere with or disrupt the Service or servers</li>
          </ul>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>In no event shall CoStacked, nor its directors, employees, or agents, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
          <ul>
            <li>Your access to or use of or inability to access or use the Service</li>
            <li>Any conduct or content of any third party on the Service</li>
            <li>Any content obtained from the Service</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content</li>
          </ul>
          <p><strong>Disclaimer:</strong> CoStacked does not vet users or projects. We are not responsible for the conduct of any user of our service. You are solely responsible for your interactions with other users and any agreements you enter into with them.</p>
        </section>

        <section>
          <h2>9. Indemnification</h2>
          <p>You agree to defend, indemnify, and hold harmless CoStacked and its affiliates from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service or violation of these Terms.</p>
        </section>

        <section>
          <h2>10. Termination</h2>
          <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>
          <p>You may also delete your account at any time through your account settings or by contacting us.</p>
        </section>

        <section>
          <h2>11. Governing Law</h2>
          <p>These Terms shall be governed and construed in accordance with the laws of South Africa, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>
        </section>

        <section>
          <h2>12. Changes to Terms</h2>
          <p>We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
        </section>
        
        <section>
          <h2>13. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at:</p>
          <p><strong>Email:</strong> info@costacked.co.za</p>
        </section>
      </div>
    </div>
  );
};