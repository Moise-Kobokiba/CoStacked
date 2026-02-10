// src/components/shared/Avatar.jsx
import styles from './Avatar.module.css';
export const Avatar = ({ src, fallback, alt = '', size = 'default', onClick }) => {
  const sizeClass = size === 'xlarge' ? styles.xlarge : 
                    size === 'large' ? styles.large : 
                    size === 'medium' ? styles.medium : styles.default;
  
  return (
    <div className={`${styles.avatar} ${sizeClass}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      {src ? (
        <img src={src} alt={alt} className={styles.image} />
      ) : (
        <span className={styles.fallback}>{fallback}</span>
      )}
    </div>
  );
};