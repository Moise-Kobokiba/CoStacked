// src/components/notifications/EmailNotificationPreview.jsx

import PropTypes from 'prop-types';
import { Avatar } from '../shared/Avatar';
import { Circle, MapPin } from 'lucide-react';
import styles from './EmailNotificationPreview.module.css';

export const EmailNotificationPreview = ({
  senderName = 'Alex Johnson',
  senderTitle = 'Senior UX Engineer',
  senderLocation = 'San Francisco, CA',
  senderAvatar = null,
  message = "Hi! I came across your work on the AI Marketplace project and was really impressed by your approach to the recommendation engine. I'd love to connect and potentially collaborate on something together.",
  isOnline = true
}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.brandingHeader}>
          <div className={styles.brandLogo}>
            <span className={styles.brandIcon}>CS</span>
            <span className={styles.brandName}>CoStacked</span>
          </div>
        </div>

        {/* Notification Title */}
        <div className={styles.section}>
          <h1 className={styles.title}>New Connection Request</h1>
        </div>

        {/* Sender Profile */}
        <div className={styles.senderSection}>
          <div className={styles.senderCard}>
            <div className={styles.avatarWrapper}>
              <Avatar
                src={senderAvatar}
                fallback={senderName.charAt(0)}
                size="large"
              />
              {isOnline && (
                <span className={styles.onlineDot}>
                  <Circle size={10} fill="#10b981" color="#10b981" />
                </span>
              )}
            </div>
            <h2 className={styles.senderName}>{senderName}</h2>
            <p className={styles.senderTitle}>{senderTitle}</p>
            <div className={styles.locationRow}>
              <MapPin size={14} />
              <span>{senderLocation}</span>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className={styles.messageSection}>
          <div className={styles.messageBlock}>
            <p className={styles.messageText}>"{message}"</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsSection}>
          <button className={styles.acceptBtn}>
            Accept Request
          </button>
          <button className={styles.profileBtn}>
            View Profile
          </button>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerLinks}>
            <span className={styles.footerLink}>Manage Notifications</span>
            <span className={styles.footerSeparator}>&bull;</span>
            <span className={styles.footerLink}>Privacy Policy</span>
            <span className={styles.footerSeparator}>&bull;</span>
            <span className={styles.footerLink}>Unsubscribe</span>
          </div>
          <div className={styles.footerLegal}>
            <p className={styles.legalText}>
              &copy; {new Date().getFullYear()} CoStacked. All rights reserved.
            </p>
            <p className={styles.legalText}>
              350 Mission Street, San Francisco, CA 94105
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

EmailNotificationPreview.propTypes = {
  senderName: PropTypes.string,
  senderTitle: PropTypes.string,
  senderLocation: PropTypes.string,
  senderAvatar: PropTypes.string,
  message: PropTypes.string,
  isOnline: PropTypes.bool,
};