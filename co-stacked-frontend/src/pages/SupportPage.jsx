import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { submitReport } from '../features/reports/reportsSlice';
import { Accordion } from '../components/shared/Accordion';
import { Card } from '../components/shared/Card';
import { Label } from '../components/shared/Label';
import { Select } from '../components/shared/Select';
import { Textarea } from '../components/shared/Textarea';
import { Button } from '../components/shared/Button';
import { Loader2 } from 'lucide-react';
import styles from './SupportPage.module.css';

// The FAQ data remains unchanged.
const faqs = [
  {
    question: "How do I post a project?",
    answer: "Navigate to your dashboard and click the 'Post a New Project' button. Fill out the form with as much detail as possible to attract the right talent."
  },
  {
    question: "What happens when I 'connect' with a user?",
    answer: "When you express interest in a project, the project founder receives a notification. If they approve your request, a direct message channel is opened for both of you to discuss details."
  },
  {
    question: "How do I report a user or project?",
    answer: "On any project detail page or user profile, you will find a 'Report' button. If you have a general concern, you can also use the contact form on this page with the subject 'User/Project Report Inquiry'."
  },
  {
    question: "How can I delete my account?",
    answer: "You can request account deletion by navigating to Settings > Account and clicking 'Delete Account'. Please note this action is irreversible."
  }
];

export const SupportPage = () => {
  const dispatch = useDispatch();
  const { status, error } = useSelector(state => state.reports); 
  const { isAuthenticated } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({ subject: 'general', message: '' });
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(''); // Clear previous success messages

    if (!isAuthenticated) {
      alert("Please log in or sign up to submit a support request.");
      return;
    }

    const reportData = {
      type: 'support_ticket', // A general support ticket
      reason: formData.subject,
      comment: formData.message,
    };
    
    const resultAction = await dispatch(submitReport(reportData));
    
    if (submitReport.fulfilled.match(resultAction)) {
      setSuccessMessage(resultAction.payload.message);
      setFormData({ subject: 'general', message: '' }); // Reset form on success
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Support Center</h1>
          <p className={styles.subtitle}>How can we help you today?</p>
        </div>
        {isAuthenticated && (
          <div style={{ marginTop: '1rem' }}>
            <Link to="/support/tickets" style={{ background: 'var(--primary-accent)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
              View My Tickets
            </Link>
          </div>
        )}
      </header>

      {/* --- FAQ Section --- */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqContainer}>
          {faqs.map((faq) => (
            <Accordion key={faq.question} title={faq.question}>
              <div>{faq.answer}</div> 
            </Accordion>
          ))}
        </div>
      </section>

      {/* --- Contact Form Section --- */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Still need help?</h2>
        <p className={styles.sectionSubtitle}>Send us a message and our team will get back to you.</p>
        <Card>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <Label htmlFor="subject">What is your question about?</Label>
              <Select id="subject" name="subject" value={formData.subject} onChange={handleChange}
                options={[
                  { value: 'general', label: 'General Inquiry' },
                  { value: 'technical', label: 'Technical Issue' },
                  { value: 'report', label: 'User/Project Report Inquiry' },
                  { value: 'account', label: 'Account Help' }
                ]}
              />
            </div>
            <div className={styles.formGroup}>
              <Label htmlFor="message">Your Message</Label>
              <Textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={6} required placeholder="Please describe your issue in detail..."/>
            </div>

            {/* --- Feedback Messages --- */}
            {status === 'failed' && <p className={styles.error}>{error}</p>}
            {successMessage && <p className={styles.success}>{successMessage}</p>}
            
            <Button type="submit" disabled={status === 'loading' || !isAuthenticated}>
              {status === 'loading' ? <Loader2 className="animate-spin" /> : 'Send Message'}
            </Button>
            {!isAuthenticated && <p className={styles.loginNote}>You must be logged in to send a message.</p>}
          </form>
        </Card>
      </section>
    </div>
  );
};