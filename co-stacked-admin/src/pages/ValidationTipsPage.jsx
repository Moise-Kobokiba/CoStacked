import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import API from '../api/axios';
import styles from './ValidationDashboardPage.module.css';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';

const formatDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
};

export const ValidationTipsPage = () => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchTips = async () => {
    setLoading(true);
    try {
      const res = await API.get('/validation-tips?admin=true');
      setTips(res.data.manualTips || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchTips(); }, []);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const socket = io(API_URL, { transports: ['websocket'] });
    socket.on('validation_tips_updated', () => fetchTips());
    return () => { try { socket.disconnect(); } catch (e) {} };
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return alert('Title and content required');
    try {
      await API.post('/validation-tips', {
        title: title.trim(),
        content: content.trim(),
        order: tips.length,
        isActive,
        startAt: startAt || null,
        endAt: endAt || null,
      });
      setTitle(''); setContent(''); setStartAt(''); setEndAt(''); setIsActive(true);
      fetchTips();
    } catch (e) { alert('Failed to create tip'); }
  };

  const handleUpdate = async (id, data) => {
    try {
      await API.put(`/validation-tips/${id}`, data);
      fetchTips();
    } catch (e) { alert('Failed to update tip'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this tip?')) return;
    try { await API.delete(`/validation-tips/${id}`); fetchTips(); } catch (e) { alert('Failed to delete tip'); }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Validation Tips</h1>
        <p>Manage tips shown on the Validation Board.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <input placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <input placeholder="Content" value={content} onChange={(e)=>setContent(e.target.value)} />
        <input
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          placeholder="Start At"
          aria-label="Tip start date"
        />
        <input
          type="datetime-local"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          placeholder="End At"
          aria-label="Tip end date"
        />
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>
        <button onClick={handleCreate} className={styles.actionBtn}><PlusCircle /> Create</button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem' }}><Loader2 className="animate-spin" /></div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr><th>Order</th><th>Title</th><th>Content</th><th>Start</th><th>End</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tips.map(t => (
                <tr key={t._id}>
                  <td>
                    <input type="number" defaultValue={t.order || 0} onBlur={(e)=>handleUpdate(t._id, { order: Number(e.target.value) })} />
                  </td>
                  <td><input defaultValue={t.title} onBlur={(e)=>handleUpdate(t._id, { title: e.target.value })} /></td>
                  <td><input defaultValue={t.content} onBlur={(e)=>handleUpdate(t._id, { content: e.target.value })} /></td>
                  <td>
                    <input
                      type="datetime-local"
                      defaultValue={formatDateTimeLocal(t.startAt)}
                      onBlur={(e)=>handleUpdate(t._id, { startAt: e.target.value || '' })}
                    />
                  </td>
                  <td>
                    <input
                      type="datetime-local"
                      defaultValue={formatDateTimeLocal(t.endAt)}
                      onBlur={(e)=>handleUpdate(t._id, { endAt: e.target.value || '' })}
                    />
                  </td>
                  <td>
                    <input type="checkbox" defaultChecked={!!t.isActive} onChange={(e)=>handleUpdate(t._id, { isActive: e.target.checked })} />
                  </td>
                  <td>
                    <button onClick={()=>handleDelete(t._id)} className={styles.deleteBtn}><Trash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ValidationTipsPage;
