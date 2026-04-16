import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateShowcase } from '../../api/stackSuiteApi';
import styles from './StackSuite.module.css';

export function EditShowcaseModal({ showcase, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    longDescription: '',
    stage: 'Idea',
    techStack: '',
    looking: '',
    teamSize: 1,
    launched: '',
  });

  useEffect(() => {
    if (showcase) {
      setFormData({
        name: showcase.name || '',
        description: showcase.description || '',
        longDescription: showcase.longDescription || '',
        stage: showcase.stage || 'Idea',
        techStack: showcase.techStack ? showcase.techStack.join(', ') : '',
        looking: showcase.looking ? showcase.looking.join(', ') : '',
        teamSize: showcase.teamSize || 1,
        launched: showcase.launched || '',
      });
    }
  }, [showcase]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateShowcase(showcase._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['showcases']);
      queryClient.invalidateQueries(['showcase', showcase._id]);
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
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>Edit Showcase</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <form id="edit-showcase-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Project Name *</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Short Description *</label>
              <input required name="description" value={formData.description} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Stage</label>
              <select name="stage" value={formData.stage} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }}>
                <option value="Idea">Idea</option>
                <option value="MVP">MVP</option>
                <option value="Beta">Beta</option>
                <option value="Launched">Launched</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Tech Stack (comma separated)</label>
              <input name="techStack" value={formData.techStack} onChange={handleChange} placeholder="e.g. React, Node.js, MongoDB" className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Looking For (comma separated roles)</label>
              <input name="looking" value={formData.looking} onChange={handleChange} placeholder="e.g. Co-founder, UI Designer" className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Team Size</label>
                <input type="number" min="1" name="teamSize" value={formData.teamSize} onChange={handleChange} className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Launch Date</label>
                <input name="launched" value={formData.launched} onChange={handleChange} placeholder="e.g. Q3 2026" className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Long Description</label>
              <textarea name="longDescription" value={formData.longDescription} onChange={handleChange} rows={5} className="form-control" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-background)', color: 'var(--foreground)', resize: 'vertical' }} />
            </div>
          </form>
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--foreground)' }}>
            Cancel
          </button>
          <button type="submit" form="edit-showcase-form" disabled={updateMutation.isLoading} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            {updateMutation.isLoading && <Loader2 size={14} className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
