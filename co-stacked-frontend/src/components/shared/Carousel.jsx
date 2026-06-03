// src/components/shared/Carousel.jsx

import styles from './Carousel.module.css';
import PropTypes from 'prop-types';

export const Carousel = ({ children }) => {
  return (
    <div className={styles.carouselContainer}>
      {children}
    </div>
  );
};

Carousel.propTypes = {
  children: PropTypes.node.isRequired,
};