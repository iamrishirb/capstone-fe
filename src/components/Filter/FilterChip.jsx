// src/components/Filter/FilterChip.js

import React from 'react';
import styles from './filters.module.css';

const getRandomLightColor = () => {
    const letters = 'BCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
};

const FilterChip = ({ filter, onRemove }) => {
    const handleRemove = () => {
        onRemove(filter);
    };

    const chipStyle = {
        backgroundColor: getRandomLightColor(),
    };

    return (
        <div className={styles['filter-chip']} style={chipStyle}>
            <span>{filter}</span>
            <button className={styles["remove-btn"]} onClick={handleRemove}>
                &times;
            </button>
        </div>
    );
};

export default FilterChip;
