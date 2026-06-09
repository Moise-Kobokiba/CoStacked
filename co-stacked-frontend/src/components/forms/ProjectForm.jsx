// src/components/forms/ProjectForm.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, updateProject } from '../../features/projects/projectsSlice';
import styles from './ProjectForm.module.css';

// Import all UI components
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Label } from '../shared/Label';
import { Select } from '../shared/Select';
import { Textarea } from '../shared/Textarea';
import { Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';


// Define the options for the Select dropdowns.
const compensationOptions = [
  { value: '', label: 'Select compensation type...' },
  { value: 'Equity-based', label: 'Equity-based' },
  { value: 'Paid Freelance', label: 'Paid Freelance' },
  { value: 'Hybrid (Paid + Equity)', label: 'Hybrid (Paid + Equity)' },
  { value: 'Unpaid (Passion Project)', label: 'Unpaid (Passion Project)' },
];

const stageOptions = [
  { value: 'Concept', label: 'Concept' },
  { value: 'Wireframe', label: 'Wireframe' },
  { value: 'Prototype', label: 'Prototype' },
  { value: 'MVP Development', label: 'MVP Development' },
  { value: 'Alpha', label: 'Alpha/Beta' },
  { value: 'Live', label: 'Live' },
];

/**
 * A multi-purpose form for creating and editing projects.
 * - If a `projectId` is passed, it operates in "edit" mode.
 * - Otherwise, it operates in "create" mode.
 */
export const ProjectForm = ({ projectId, initialProject = null }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isEditMode = Boolean(projectId);

  // If in edit mode, find the specific project to edit from the Redux state.
  // We look in `myItems` which is populated by the `MyProjectsPage`.
  const projectToEdit = useSelector((state) =>
    isEditMode ? state.projects.myItems.find((p) => p._id === projectId) : null
  );

  const { status, error } = useSelector((state) => state.projects);

  const [formData, setFormData] = useState({
    title: '', description: '', skills: '', compensation: '', stage: 'Concept', location: ''
  });

  // Prefill form with passed in draft project details for a conversion flow.
  useEffect(() => {
    if (!isEditMode && initialProject) {
      setFormData({
        title: initialProject.title || '',
        description: initialProject.description || '',
        skills: initialProject.skills || '',
        compensation: initialProject.compensation || '',
        stage: initialProject.stage || 'Concept',
        location: initialProject.location || '',
      });
    }
  }, [initialProject, isEditMode]);

  // This effect pre-populates the form with the project's data when in edit mode.
  useEffect(() => {
    if (isEditMode && projectToEdit) {
      setFormData({
        title: projectToEdit.title || '',
        description: projectToEdit.description || '',
        skills: Array.isArray(projectToEdit.skillsNeeded) ? projectToEdit.skillsNeeded.join(', ') : '',
        compensation: projectToEdit.compensation || '',
        stage: projectToEdit.stage || 'Concept',
        location: projectToEdit.location || '',
      });
    }
  }, [isEditMode, projectToEdit]);


  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.compensation) {
      alert("Please select a compensation type for your project.");
      return;
    }
    
    if (isEditMode) {
      // In edit mode, dispatch the UPDATE action
      const resultAction = await dispatch(updateProject({ projectId, projectData: formData }));
      if (updateProject.fulfilled.match(resultAction)) {
        alert("Project updated successfully!");
        navigate('/my-projects');
      }
    } else {
      // In create mode, dispatch the CREATE action
      const resultAction = await dispatch(createProject(formData));
      if (createProject.fulfilled.match(resultAction)) {
        const newProject = resultAction.payload;
        alert("Project Posted Successfully!");
        navigate(`/projects/${newProject._id}`);
      }
    }
  };

  // Dynamically set UI text based on the mode
  const titleText = isEditMode ? 'Edit Your Project' : 'Post a New Project Idea';
  const descriptionText = isEditMode ? 'Update the details for your project.' : 'Describe your project to find the perfect collaborators.';
  const buttonText = isEditMode ? 'Save Changes' : 'Post Project';

  return (
    <Card className={styles.card}>
      <header className={styles.header}>
        <h1 className={styles.title}>{titleText}</h1>
        <p className={styles.description}>{descriptionText}</p>
      </header>

      {/* Show a loading state if in edit mode but the data isn't available yet */}
      {isEditMode && !projectToEdit ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading project data...</div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <Label htmlFor="title">Project Title</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., AI-Powered Fitness Coach" required />
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={5} placeholder="A detailed description of your project..." required />
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="skills">Skills Needed (comma-separated)</Label>
            <Input id="skills" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g., React, Node.js, Figma" required />
          </div>

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Cape Town, WC or Remote" required />
            </div>
            <div className={styles.formGroup}>
              <Label htmlFor="compensation">Compensation</Label>
              <Select name="compensation" value={formData.compensation} onChange={handleChange} options={compensationOptions} required />
            </div>
            <div className={styles.formGroup}>
              <Label htmlFor="stage">Project Stage</Label>
              <Select name="stage" value={formData.stage} onChange={handleChange} options={stageOptions} required />
            </div>
          </div>

          {status === 'failed' && error && <p className={styles.error}>{error}</p>}
          
          <Button type="submit" className={styles.submitButton} disabled={status === 'loading'}>
            {status === 'loading' ? (<><Loader2 className={styles.loader} /> Saving...</>) : ( buttonText )}
          </Button>
        </form>
      )}
    </Card>
  );
};

// Add PropTypes for our new optional prop
ProjectForm.propTypes = {
  projectId: PropTypes.string,
  initialProject: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    skills: PropTypes.string,
    compensation: PropTypes.string,
    stage: PropTypes.string,
    location: PropTypes.string,
  }),
};