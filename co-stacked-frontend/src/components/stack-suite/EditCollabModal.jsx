import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCollabThread } from '../../api/stackSuiteApi';
import styles from './StackSuite.module.css';

export function EditCollabModal({ thread, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    project: '',
    milestone: '',
    description: '',
    longDescription: '',
    progress: 'In Progress',
    branch: '',
    deadline: '',
    attachment: '',
  });

  useEffect(() => {
    if (thread) {
      setFormData({
        project: thread.project || '',
        milestone: thread.milestone || '',
        description: thread.description || '',
        longDescription: thread.longDescription || '',
        progress: thread.progress || 'In Progress',
        branch: thread.branch || '',
        deadline: thread.deadline ? new Date(thread.deadline).toISOString().split('T')[0] : '', // Format for date input if valid, else empty
        attachment: thread.attachment || '',
      });
    }
  }, [thread]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateCollabThread(thread._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['threads']);
      queryClient.invalidateQueries(['thread', thread._id]);
      onClose();
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: 'var(--card-background)', width: '100%', maxWidth: 600,
        borderRadius: 16, border: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', maxHeight: '90vh'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>Edit Collaboration Thread</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <form id="edit-collab-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Project (Idea Name) *</label>
              <input required name="project" value={formData.project} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Milestone / Title *</label>
              <input required name="milestone" value={formData.milestone} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Short Description *</label>
              <input required name="description" value={formData.description} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Progress Stage</label>
              <select name="progress" value={formData.progress} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }}>
                <option value="In Progress">In Progress</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Git Branch</label>
                <input name="branch" value={formData.branch} onChange={handleChange} placeholder="e.g. feature/auth" className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Deadline</label>
                <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Attachment / Link</label>
              <input name="attachment" value={formData.attachment} onChange={handleChange} placeholder="Figma link, Docs, etc." className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Detailed Information</label>
              <textarea name="longDescription" value={formData.longDescription} onChange={handleChange} rows={5} className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)', resize: 'vertical' }} />
            </div>
          </form>
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--foreground)' }}>
            Cancel
          </button>
          <button type="submit" form="edit-collab-form" disabled={updateMutation.isLoading} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            {updateMutation.isLoading && <Loader2 size={14} className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
