// src/components/Filter/FilterChip.js

import React from 'react';
import styles from './filters.module.css';

const FilterChip = ({ filter, onRemove }) => {
    const handleRemove = () => {
        onRemove(filter);
    };

    return (
        <div className={styles['filter-chip']}>
            <span>{filter}</span>
            <button className={styles["remove-btn"]} onClick={handleRemove}>
                &times;
            </button>
        </div>
    );
};

export default FilterChip;
