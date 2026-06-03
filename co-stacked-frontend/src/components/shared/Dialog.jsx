// src/components/shared/Dialog.jsx

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Dialog.module.css';
import PropTypes from 'prop-types';
import { useEffect } from 'react';

// Get the DOM node we created in index.html. This is done once when the module loads.
const modalRoot = document.getElementById('modal-root');

export const Dialog = ({ open, onClose, children }) => {
  // This effect prevents the main page from scrolling in the background when the modal is open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function to restore scrolling when the component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);
  
  // createPortal takes two arguments:
  // 1. The JSX you want to render.
  // 2. The physical DOM element you want to render it into.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.backdrop}
          onClick={onClose} // The modal now closes when the backdrop is clicked.
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()} // Prevents clicks inside the dialog from bubbling up to the backdrop.
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    modalRoot // The target DOM node from index.html
  );
};

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};