import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

const variants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const toastStyles = {
    success: {
        bg: '#ecfdf5', // emerald-50
        border: '#10b981', // emerald-500
        text: '#065f46', // emerald-800
        icon: CheckCircle,
    },
    error: {
        bg: '#fef2f2', // red-50
        border: '#ef4444', // red-500
        text: '#991b1b', // red-800
        icon: AlertCircle,
    },
    warning: {
        bg: '#fffbeb', // amber-50
        border: '#f59e0b', // amber-500
        text: '#92400e', // amber-800
        icon: AlertTriangle,
    },
    info: {
        bg: '#eff6ff', // blue-50
        border: '#3b82f6', // blue-500
        text: '#1e40af', // blue-800
        icon: Info,
    },
};

export const Toast = ({ message, type = 'info', onClose }) => {
    const style = toastStyles[type] || toastStyles.info;
    const Icon = style.icon;

    return (
        <motion.div
            layout
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'white', // Basic white background
                backgroundColor: style.bg, // Tinted background
                borderLeft: `4px solid ${style.border}`,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                width: '320px',
                maxWidth: '100vw',
                pointerEvents: 'auto', // Re-enable pointer events for the toast itself
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Icon size={24} color={style.border} style={{ flexShrink: 0 }} />

            <p style={{
                margin: 0,
                color: style.text,
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '1.4',
                flex: 1
            }}>
                {message}
            </p>

            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: style.text,
                    opacity: 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

Toast.propTypes = {
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    onClose: PropTypes.func.isRequired,
};
