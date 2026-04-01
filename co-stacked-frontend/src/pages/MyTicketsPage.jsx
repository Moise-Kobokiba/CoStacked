// src/pages/MyTicketsPage.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyReports, addReportMessage } from '../features/reports/reportsSlice';
import styles from './MyTicketsPage.module.css';
import { formatDistanceToNow } from 'date-fns';

export const MyTicketsPage = () => {
    const dispatch = useDispatch();
    const { myReports, fetchStatus, error } = useSelector((state) => state.reports);
    const currentUser = useSelector((state) => state.auth.user);
    
    // State to toggle which ticket discussion is open
    const [openTicketId, setOpenTicketId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (fetchStatus === 'idle') {
            dispatch(fetchMyReports());
        }
    }, [dispatch, fetchStatus]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (openTicketId && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [openTicketId, myReports]);

    const handleSendReply = async (e, reportId) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setSending(true);
        try {
            await dispatch(addReportMessage({ reportId, content: replyText })).unwrap();
            setReplyText('');
        } catch (err) {
            alert('Failed to send reply.');
        } finally {
            setSending(false);
        }
    };

    const toggleTicket = (id) => {
        setOpenTicketId(openTicketId === id ? null : id);
        setReplyText(''); // Clear draft reply when switching
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'open': return styles.statusOpen;
            case 'resolved': return styles.statusResolved;
            case 'dismissed': return styles.statusDismissed;
            default: return styles.statusOpen;
        }
    };

    if (fetchStatus === 'loading') {
        return <div className={styles.pageContainer}><p>Loading your tickets...</p></div>;
    }

    if (fetchStatus === 'failed') {
        return <div className={styles.pageContainer}><p>Error: {error}</p></div>;
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>My Support Tickets</h1>
                    <p className={styles.subtitle}>Check the status of your reports and receive updates from the Co-Stacked team.</p>
                </div>
            </div>

            {myReports.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>You haven't submitted any tickets yet.</p>
                </div>
            ) : (
                <div className={styles.ticketList}>
                    {myReports.map((ticket) => (
                        <div key={ticket._id} className={styles.ticketCard}>
                            <div className={styles.ticketHeader}>
                                <div>
                                    <span className={styles.ticketId}>Ticket #{ticket._id.substring(ticket._id.length - 6).toUpperCase()}</span>
                                    <span className={styles.ticketDate}> • {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                                </div>
                                <span className={`${styles.statusBadge} ${getStatusClass(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                            </div>

                            <h3 className={styles.ticketReason}>{ticket.reason}</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                                {ticket.comment}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button 
                                    onClick={() => toggleTicket(ticket._id)}
                                    className={styles.toggleChatBtn}
                                >
                                    {openTicketId === ticket._id ? 'Close Details' : 'View Updates & Reply'}
                                </button>
                            </div>

                            {/* EXpANDABLE CHAT SECTION */}
                            {openTicketId === ticket._id && (
                                <div className={styles.chatSection}>
                                    <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Communication History
                                    </h4>
                                    
                                    <div className={styles.messagesContainer}>
                                        {(!ticket.messages || ticket.messages.length === 0) ? (
                                            <p style={{ textAlign: 'center', color: '#999', fontSize: '0.9rem', padding: '2rem 0' }}>
                                                Our team hasn't replied to this ticket yet. You can add more information below if needed.
                                            </p>
                                        ) : (
                                            ticket.messages.map((msg, index) => {
                                                const isMine = msg.senderModel === 'User' && msg.sender?._id === currentUser?._id;
                                                return (
                                                    <div 
                                                        key={msg._id || index} 
                                                        className={`${styles.message} ${isMine ? styles.messageUser : styles.messageAdmin}`}
                                                    >
                                                        {!isMine && (
                                                            <div className={styles.messageMeta}>
                                                                <img 
                                                                    src={msg.sender?.avatarUrl || 'https://via.placeholder.com/40'} 
                                                                    alt="Admin" 
                                                                    className={styles.adminAvatar} 
                                                                />
                                                                <strong>{msg.sender?.name || 'CoStacked Support'}</strong>
                                                            </div>
                                                        )}
                                                        <div style={{ wordBreak: 'break-word' }}>{msg.content}</div>
                                                        <div style={{ fontSize: '0.65rem', marginTop: '0.4rem', opacity: 0.6, textAlign: isMine ? 'right' : 'left' }}>
                                                            {formatDistanceToNow(new Date(msg.createdAt))} ago
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {ticket.status !== 'dismissed' ? (
                                        <form onSubmit={(e) => handleSendReply(e, ticket._id)} className={styles.messageForm}>
                                            <textarea
                                                className={styles.messageInput}
                                                placeholder="Type your reply to our team..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                            />
                                            <button 
                                                type="submit" 
                                                className={styles.sendButton}
                                                disabled={sending || !replyText.trim()}
                                            >
                                                {sending ? 'Sending...' : 'Send'}
                                            </button>
                                        </form>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-primary)', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                                            This ticket has been dismissed by moderation.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
