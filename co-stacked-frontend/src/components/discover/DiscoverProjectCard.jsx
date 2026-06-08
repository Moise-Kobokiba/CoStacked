// src/components/discover/DiscoverProjectCard.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Heart } from 'lucide-react';
import { saveItem, unsaveItemByType, checkSaved } from '../../api/savedItemsApi';
import styles from './DiscoverProjectCard.module.css';

export const DiscoverProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useSelector((state) => state.auth || {});
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!project?._id || !token || !isAuthenticated) return;

    checkSaved(token, 'project', project._id)
      .then((data) => {
        setIsFavorited(data.isSaved);
      })
      .catch((error) => {
        console.error('Failed to check saved state:', error);
      });
  }, [project?._id, token, isAuthenticated]);

  if (!project) return null;

  // Map backend stages/phases to design badges matching the Figma/Tailwind template
  const getBadgeDetails = (stage) => {
    const s = stage?.toLowerCase() || '';
    if (s.includes('idea') || s.includes('concept') || s.includes('wireframe')) {
      return { className: styles.badgeIdea, label: 'Idea Phase' };
    }
    if (s.includes('validation') || s.includes('prototype') || s.includes('alpha') || s.includes('pre-alpha')) {
      return { className: styles.badgeValidation, label: 'Validation Phase' };
    }
    if (s.includes('mvp') || s.includes('beta')) {
      return { className: styles.badgeMvp, label: 'MVP Built' };
    }
    if (s.includes('live')) {
      return { className: styles.badgeSeeking, label: 'Scaling' };
    }
    return { className: styles.badgeDefault, label: stage || 'Idea Phase' };
  };

  const badge = getBadgeDetails(project.stage);
  
  // Use skills needed as tags, fallback to general if any
  const tags = Array.isArray(project.skillsNeeded) && project.skillsNeeded.length > 0
    ? project.skillsNeeded.slice(0, 3) 
    : ['General'];

  // Mock team members based on founder + placeholder for UI demonstration
  const founderAvatar = project.founderId?.avatarUrl;
  const founderInitials = project.founder ? project.founder.slice(0, 2).toUpperCase() : 'U';
  
  // For UI demonstration, assume team size of 1 + a few random if needed.
  // In reality, we'd map over project.team or similar.
  const teamSize = project.teamSize || 1;
  const extraMembers = Math.max(0, teamSize - 1);

  return (
    <article className={styles.card} onClick={() => navigate(`/projects/${project._id}`)}>
      <div className={styles.content}>
        <div className={styles.cardHeader}>
          <span className={`${styles.badge} ${badge.className}`}>
            {badge.label}
          </span>
          <button 
            className={styles.favoriteBtn} 
            onClick={async (e) => {
              e.stopPropagation();

              if (!isAuthenticated) {
                navigate('/login');
                return;
              }

              try {
                if (isFavorited) {
                  await unsaveItemByType(token, { itemType: 'project', itemId: project._id });
                  setIsFavorited(false);
                  setSavedItemId(null);
                } else {
                  const savedItem = await saveItem(token, { itemType: 'project', itemId: project._id });
                  setIsFavorited(true);
                  setSavedItemId(savedItem._id);
                }
              } catch (error) {
                console.error('Failed to toggle favorite:', error);
              }
            }}
            aria-label={isFavorited ? 'Remove from saved projects' : 'Save project'}
            style={{ color: isFavorited ? '#ef4444' : undefined }}
          >
            <Heart size={18} />
          </button>
        </div>
        
        <h3 className={styles.title}>{project.title || 'Untitled Project'}</h3>
        
        <p className={styles.description}>
          {project.description || 'No description provided.'}
        </p>
        
        <div className={styles.tags}>
          {tags.map((tag, idx) => (
            <span key={idx} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.avatarStack}>
          {/* Founder Avatar */}
          <div className={styles.avatarWrapper}>
            {founderAvatar ? (
              <img src={founderAvatar} alt={project.founder} className={styles.avatarImage} />
            ) : (
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{founderInitials}</span>
            )}
          </div>
          
          {/* Mock extra team members for UI matching */}
          {extraMembers > 0 && extraMembers <= 2 && Array.from({ length: extraMembers }).map((_, i) => (
            <div key={i} className={styles.avatarWrapper} style={{ backgroundColor: '#e2e8f0' }}>
               <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>T{i+1}</span>
            </div>
          ))}
          
          {extraMembers > 2 && (
             <div className={`${styles.avatarWrapper} ${styles.avatarMore}`}>
               +{extraMembers - 1}
             </div>
          )}
        </div>
        
        <button 
          className={styles.viewBtn}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/projects/${project._id}`);
          }}
        >
          View Details
        </button>
      </div>
    </article>
  );
};
