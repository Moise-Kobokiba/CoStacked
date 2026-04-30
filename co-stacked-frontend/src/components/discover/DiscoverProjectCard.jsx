// src/components/discover/DiscoverProjectCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import styles from './DiscoverProjectCard.module.css';

export const DiscoverProjectCard = ({ project }) => {
  const navigate = useNavigate();

  if (!project) return null;

  // Map backend stages/phases to design badges
  const getBadgeClass = (stage) => {
    const s = stage?.toLowerCase() || '';
    if (s.includes('idea')) return styles.badgeIdea;
    if (s.includes('validation')) return styles.badgeValidation;
    if (s.includes('mvp')) return styles.badgeMvp;
    if (s.includes('cofounder')) return styles.badgeSeeking;
    return styles.badgeDefault;
  };

  const badgeClass = getBadgeClass(project.stage);
  
  // Use skills needed as tags, fallback to categories if any
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
          <span className={`${styles.badge} ${badgeClass}`}>
            {project.stage || 'Idea Phase'}
          </span>
          <button 
            className={styles.favoriteBtn} 
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement actual favorite logic
              console.log('Toggle favorite for', project._id);
            }}
            aria-label="Save project"
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
