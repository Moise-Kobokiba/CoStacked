// src/components/notifications/NotificationCard.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  UserPlus, MessageSquare, CheckCircle, 
  FileText, Rocket, Layers, Shield, ChevronDown,
  Loader2, Check, XCircle, Quote, AlertTriangle, Briefcase
} from 'lucide-react';
import { Avatar } from '../shared/Avatar';
import { acceptConnectionRequest, removeOrCancelConnection } from '../../features/connections/connectionsSlice';
import styles from './NotificationCard.module.css';
import PropTypes from 'prop-types';

export const NotificationCard = ({ notification }) => {
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionResult, setActionResult] = useState(null); // 'accepted' | 'declined' | 'error'
  const { connections, pendingRequests, status: connectionsStatus, pendingRequestsStatus } = useSelector(state => state.connections);

  const handleAcceptConnection = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (notification.sender?._id && !isProcessing) {
      setIsProcessing(true);
      try {
        await dispatch(acceptConnectionRequest(notification.sender._id)).unwrap();
        setActionResult('accepted');
      } catch (err) {
        console.error('Failed to accept connection:', err);
        setActionResult('error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDeclineConnection = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (notification.sender?._id && !isProcessing) {
      setIsProcessing(true);
      try {
        await dispatch(removeOrCancelConnection(notification.sender._id)).unwrap();
        setActionResult('declined');
      } catch (err) {
        console.error('Failed to decline connection:', err);
        setActionResult('error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  let config = {
    icon: <Layers size={18} />,
    iconBg: '#2463eb',
    message: '',
    linkTo: '/dashboard',
    showActions: false,
    showCommentSnippet: false,
    actionLabel: null,
    secondaryActionLabel: null
  };

  const senderName = notification.sender?.name || 'Someone';

  switch (notification.type) {
    case 'NEW_CONNECTION_REQUEST':
      config = {
        icon: <UserPlus size={18} />,
        iconBg: '#2463eb',
        message: (
          <><span className="font-bold">{senderName}</span> sent you a connection request</>
        ),
        linkTo: `/users/${notification.sender?._id}`,
        showActions: true,
        actionLabel: 'Accept',
        secondaryActionLabel: 'Decline'
      };
      break;
    case 'NEW_INTEREST':
      config = {
        icon: <div className={styles.projectIcon}><FileText size={18} /></div>,
        iconBg: '#10b981',
        message: (
          <>New project <span className="font-bold">"{notification.projectId?.title || 'Design System'}"</span> was shared with you</>
        ),
        linkTo: `/projects/${notification.projectId?._id}`,
        actionLabel: 'View Project'
      };
      break;
    case 'IDEA_COMMENT':
      config = {
        icon: <Avatar src={notification.sender?.avatarUrl} size="medium" />,
        iconBg: 'transparent',
        message: (
          <><span className="font-bold">{senderName}</span> mentioned you in a comment</>
        ),
        linkTo: `/validation-board/${notification.relatedId}`,
        showCommentSnippet: true,
        actionLabel: 'Reply to comment'
      };
      break;
    case 'SUBSCRIPTION_SUCCESS':
      config = {
        icon: <Shield size={18} />,
        iconBg: '#fef3c7',
        iconColor: '#d97706',
        message: (
          <>Security Alert: <span className="font-bold">New login detected</span> from Chrome on Windows</>
        ),
        linkTo: '/settings',
        actionLabel: 'Review Security Activity'
      };
      break;
    case 'CONNECTION_ACCEPTED':
      config = {
        icon: <UserPlus size={18} />,
        iconBg: '#10b981',
        message: (
          <><span className="font-bold">{senderName}</span> accepted your connection request</>
        ),
        linkTo: '/my-network',
        actionLabel: 'View Network'
      };
      break;
    case 'INTEREST_APPROVED':
      config = {
        icon: <CheckCircle size={18} />,
        iconBg: '#10b981',
        message: (
          <>Your request for project <span className="font-bold">"{notification.projectId?.title || 'Design System'}"</span> was approved</>
        ),
        linkTo: '/messages',
        actionLabel: 'Send a Message'
      };
      break;
    case 'INTEREST_REJECTED':
      config = {
        icon: <div className={styles.projectIcon}><XCircle size={18} /></div>,
        iconBg: '#ef4444',
        message: (
          <>Your request for project <span className="font-bold">"{notification.projectId?.title || 'Design System'}"</span> was declined</>
        ),
        linkTo: '/requests'
      };
      break;
    case 'NEW_MESSAGE':
      config = {
        icon: <Avatar src={notification.sender?.avatarUrl} size="medium" />,
        iconBg: 'transparent',
        message: (
          <><span className="font-bold">{senderName}</span> sent you a new message</>
        ),
        linkTo: '/messages',
        actionLabel: 'Reply'
      };
      break;
    case 'BOOST_SUCCESS':
      config = {
        icon: <Rocket size={18} />,
        iconBg: '#8b5cf6',
        message: (
          <>
            <span className="font-bold">Boost Success: </span>
            {notification.projectId 
              ? `Your project "${notification.projectId.title}" is now boosted.` 
              : 'Your profile has been successfully boosted!'}
          </>
        ),
        linkTo: notification.projectId ? '/my-projects' : '/profile'
      };
      break;
    case 'IDEA_VOTE':
      config = {
        icon: <Rocket size={18} />,
        iconBg: '#f59e0b',
        message: (
          <><span className="font-bold">{senderName}</span> voted on your idea</>
        ),
        linkTo: '/stack-suite'
      };
      break;
    case 'PAYMENT_SUCCESS':
      config = {
        icon: <CheckCircle size={18} />,
        iconBg: '#10b981',
        message: (
          <><span className="font-bold">Payment Successful</span> - Your purchase has been processed.</>
        ),
        linkTo: '/settings/billing',
        actionLabel: 'View Receipt'
      };
      break;
    case 'NEW_PROJECT_POSTED':
      config = {
        icon: <Briefcase size={18} />,
        iconBg: '#10b981',
        message: (
          <><span className="font-bold">{senderName}</span> posted a new project: <span className="text-primary font-medium">"{notification.projectId?.title || 'Untitled Project'}"</span></>
        ),
        linkTo: `/projects/${notification.projectId?._id}`,
        actionLabel: 'View Project'
      };
      break;
    case 'NEW_REVIEW':
      config = {
        icon: <Quote size={18} />,
        iconBg: '#f59e0b',
        message: (
          <><span className="font-bold">{senderName}</span> left you a review</>
        ),
        linkTo: '/profile'
      };
      break;
    case 'NEW_REPORT_SUBMITTED':
      config = {
        icon: <AlertTriangle size={18} />,
        iconBg: '#ef4444',
        message: (
          <><span className="font-bold">{senderName}</span> submitted a new report</>
        ),
        linkTo: '/admin/reports'
      };
      break;
    case 'REPORT_REPLY':
    case 'REPORT_UPDATE':
      config = {
        icon: <MessageSquare size={18} />,
        iconBg: '#3b82f6',
        message: (
          <>There is an update on your recent report</>
        ),
        linkTo: '/support'
      };
      break;
    case 'NEW_ADMIN_REGISTERED':
    case 'NEW_USER_REGISTERED':
      config = {
        icon: <UserPlus size={18} />,
        iconBg: '#8b5cf6',
        message: (
          <><span className="font-bold">{senderName}</span> just registered an account</>
        ),
        linkTo: `/users/${notification.sender?._id}`
      };
      break;
    default:
      config.message = notification.message || 'New activity in your workspace';
  }

  let resolvedStatus = actionResult;
  if (!resolvedStatus && config.showActions && connectionsStatus === 'succeeded') {
     const isConnectedGlobally = connections?.some(c => c._id === notification.sender?._id);
     
     if (isConnectedGlobally) {
         resolvedStatus = 'accepted';
     }
  }

  const exactDate = format(new Date(notification.createdAt), 'PPPP p');

  return (
    <div className={`${styles.card} ${!notification.isRead ? styles.unread : ''}`}>
      {!notification.isRead && <div className={styles.unreadIndicator} />}
      
      <div className={styles.mainArea}>
        <div className={styles.iconContainer} style={{ backgroundColor: config.iconBg, color: config.iconColor || 'white' }}>
          {config.icon}
        </div>

        <div className={styles.content}>
          <div className={styles.textRow}>
            <p className={styles.message}>{config.message}</p>
            <span className={styles.time} title={exactDate}>
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>

          {config.showCommentSnippet && notification.message && (
            <div className={styles.commentBox}>
              <p>"{notification.message}"</p>
              <div className={styles.commentMeta}>
                <span className={styles.commentTime}>{format(new Date(notification.createdAt), 'EEEE \'at\' p')}</span>
              </div>
            </div>
          )}

          <div className={styles.actionsRow}>
            {config.showActions ? (
              resolvedStatus ? (
                <div className={`${styles.resultBadge} ${styles[resolvedStatus]}`}>
                  {resolvedStatus === 'accepted' && <Check size={14} />}
                  {resolvedStatus === 'accepted' ? 'Connection Accepted' : 
                   resolvedStatus === 'declined' ? 'Request Declined' : 'Something went wrong'}
                </div>
              ) : (
                <>
                  <button 
                    className={styles.primaryBtn} 
                    onClick={handleAcceptConnection}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 size={16} className={styles.spinner} /> : 'Accept'}
                  </button>
                  <button 
                    className={styles.secondaryBtn} 
                    onClick={handleDeclineConnection}
                    disabled={isProcessing}
                  >
                    Decline
                  </button>
                </>
              )
            ) : (
              config.actionLabel && (
                <Link to={config.linkTo} className={styles.actionBtn}>
                  {notification.type === 'IDEA_COMMENT' && <MessageSquare size={14} className={styles.btnIcon} />}
                  {config.actionLabel}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

NotificationCard.propTypes = {
  notification: PropTypes.object.isRequired,
};
