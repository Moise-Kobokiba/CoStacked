// src/components/shared/SocialLinks.jsx

import { Twitter, Linkedin, Instagram, Facebook, Youtube, Link as LinkIcon } from 'lucide-react';
import styles from './SocialLinks.module.css';
import PropTypes from 'prop-types';

// Map keys from our database to the icon component
const socialPlatforms = {
  twitter: { icon: Twitter },
  linkedin: { icon: Linkedin },
  instagram: { icon: Instagram },
  facebook: { icon: Facebook },
  youtube: { icon: Youtube },
  tiktok: { icon: LinkIcon }, // Lucide doesn't have a TikTok icon, so we use a generic link
};

export const SocialLinks = ({ socials }) => {
  if (!socials) {
    return null;
  }

  // Filter out any social links that are empty or not provided
  const availableLinks = Object.entries(socials)
    .filter(([platform, value]) => value && socialPlatforms[platform])
    .map(([platform, value]) => {
      const { icon: Icon } = socialPlatforms[platform];
      // Use the URL directly as provided by the user
      const fullUrl = value;
      return { platform, Icon, url: fullUrl };
    });

  if (availableLinks.length === 0) {
    return <p className={styles.noLinks}>No social links provided.</p>;
  }

  return (
    <div className={styles.container}>
      {availableLinks.map(({ platform, Icon, url }) => (
        <a
          key={platform}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
          aria-label={`Visit ${platform} profile`}
        >
          <Icon size={22} />
        </a>
      ))}
    </div>
  );
};

SocialLinks.propTypes = {
  socials: PropTypes.shape({
    twitter: PropTypes.string,
    linkedin: PropTypes.string,
    instagram: PropTypes.string,
    facebook: PropTypes.string,
    youtube: PropTypes.string,
    tiktok: PropTypes.string,
  }),
};