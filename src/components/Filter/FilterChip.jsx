// src/components/Filter/FilterChip.js

import React from 'react';

const FilterChip = ({ filter, onRemove }) => {
    const handleRemove = () => {
        onRemove(filter);
    };

    return (
        <div className="chip">
            <span>{filter}</span>
            <button className="remove-btn" onClick={handleRemove}>
                &times;
            </button>
        </div>
    );
};

export default FilterChip;
