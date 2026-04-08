// src/components/notifications/NotificationItem.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { 
  UserPlus, 
  MessageSquare, 
  CheckCircle, 
  FileText, 
  Rocket, 
  Layers 
} from 'lucide-react';
import { Avatar } from '../shared/Avatar';
import { acceptConnectionRequest, removeOrCancelConnection } from '../../features/connections/connectionsSlice';
import styles from './NotificationDropdown.module.css';
import PropTypes from 'prop-types';

export const NotificationItem = ({ notification, onClose }) => {
  const dispatch = useDispatch();

  const handleAcceptConnection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (notification.sender?._id) {
      dispatch(acceptConnectionRequest(notification.sender._id));
      onClose();
    }
  };

  const handleDeclineConnection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (notification.sender?._id) {
      dispatch(removeOrCancelConnection(notification.sender._id));
      onClose();
    }
  };

  let config = {
    icon: <Layers size={12} />,
    iconBg: '#2463eb',
    message: '',
    linkTo: '/dashboard',
    showActions: false,
    showCommentSnippet: false
  };

  const senderName = notification.sender?.name || 'Someone';

  switch (notification.type) {
    case 'NEW_CONNECTION_REQUEST':
      config = {
        icon: <UserPlus size={12} />,
        iconBg: '#2463eb',
        message: (
          <>
            <span className="font-bold text-slate-900">{senderName}</span> sent you a request to connect from <span className="font-medium">Talent Search</span>
          </>
        ),
        linkTo: `/users/${notification.sender?._id}`,
        showActions: true
      };
      break;
    case 'CONNECTION_ACCEPTED':
      config = {
        icon: <UserPlus size={12} />,
        iconBg: '#10b981',
        message: (
          <>
            <span className="font-bold text-slate-900">{senderName}</span> accepted your connection request.
          </>
        ),
        linkTo: '/my-network'
      };
      break;
    case 'NEW_INTEREST':
      config = {
        icon: <FileText size={12} />,
        iconBg: '#10b981',
        message: (
          <>
            <span className="font-bold text-slate-900">{senderName}</span> showed interest in your project: <span className="text-primary font-medium">"{notification.projectId?.title || 'a project'}"</span>
          </>
        ),
        linkTo: '/requests'
      };
      break;
    case 'INTEREST_APPROVED':
      config = {
        icon: <CheckCircle size={12} />,
        iconBg: '#10b981',
        message: (
          <>
            Your request for <span className="font-medium">"{notification.projectId?.title || 'a project'}"</span> was approved!
          </>
        ),
        linkTo: '/messages'
      };
      break;
    case 'NEW_MESSAGE':
      config = {
        icon: <MessageSquare size={12} />,
        iconBg: '#2463eb',
        message: (
          <>
            You have a new message from <span className="font-bold">{senderName}</span>.
          </>
        ),
        linkTo: '/messages'
      };
      break;
    case 'IDEA_COMMENT':
      config = {
        icon: <MessageSquare size={12} />,
        iconBg: '#2463eb',
        message: (
          <>
            <span className="font-bold">{senderName}</span> replied to your comment on the <span className="font-medium italic">StackSuite forum</span>
          </>
        ),
        linkTo: '/stack-suite',
        showCommentSnippet: true
      };
      break;
    case 'SUBSCRIPTION_SUCCESS':
      config = {
        icon: <CheckCircle size={12} />,
        iconBg: '#10b981',
        message: (
          <>
            <span className="font-bold">Account Verified</span>
            <p className={styles.subtext}>Your profile has been successfully verified.</p>
          </>
        ),
        linkTo: '/settings'
      };
      break;
    case 'BOOST_SUCCESS':
      config = {
        icon: <Rocket size={12} />,
        iconBg: '#8b5cf6',
        message: (
          <>
            <span className="font-bold">Boost Success</span>
            <p className={styles.subtext}>
              {notification.projectId 
                ? `Your project "${notification.projectId.title}" is now boosted.` 
                : 'Your profile has been successfully boosted!'}
            </p>
          </>
        ),
        linkTo: notification.projectId ? '/my-projects' : '/profile'
      };
      break;
    default:
      config.message = notification.message || 'You have a new notification.';
  }

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    .replace('about ', '')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' ago', '');

  return (
    <Link to={config.linkTo} onClick={onClose} className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}>
      <div className={styles.avatarSection}>
        <Avatar 
          src={notification.sender?.avatarUrl} 
          fallback={(senderName || '?').charAt(0)}
          size="medium"
        />
        <div className={styles.contextIcon} style={{ backgroundColor: config.iconBg }}>
          {config.icon}
        </div>
      </div>

      <div className={styles.contentBody}>
        <div className={styles.itemHeader}>
          <p className={styles.message}>{config.message}</p>
          <span className={styles.timestamp}>{timeAgo}</span>
        </div>

        {config.showCommentSnippet && notification.message && (
          <div className={styles.commentBox}>
            "{notification.message}"
          </div>
        )}

        {config.showActions && (
          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={handleAcceptConnection}>Accept</button>
            <button className={styles.secondaryBtn} onClick={handleDeclineConnection}>Decline</button>
          </div>
        )}

        {notification.type === 'NEW_INTEREST' && (
           <button className={styles.outlineBtn}>View Project</button>
        )}
      </div>

      {!notification.isRead && <div className={styles.unreadDot}></div>}
    </Link>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};