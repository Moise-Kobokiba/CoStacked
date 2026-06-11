// src/pages/PostProjectPage.jsx
import { useLocation } from 'react-router-dom';
import { ProjectForm } from '../components/forms/ProjectForm';
import styles from './PostProjectPage.module.css';

export const PostProjectPage = () => {
  const location = useLocation();
  const initialProject = location.state?.draftProject || null;

  return (
    <div className={styles.pageContainer}>
      <ProjectForm initialProject={initialProject} />
    </div>
  );
};