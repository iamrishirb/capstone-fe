import React, { useState } from 'react';
import styles from './filters.module.css';

const FilterSearch = ({ options, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState([]);

    const handleInputChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        // Filter options based on search term
        const filtered = options.filter(option =>
            option.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredOptions(filtered);
    };

    const handleSelectOption = (option) => {
        setSearchTerm('');
        onSelect(option);
    };

    return (
        <div className={styles["filter-search"]}>
            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleInputChange}
            />
            <ul>
                {filteredOptions.map(option => (
                    <li key={option} onClick={() => handleSelectOption(option)}>
                        {option}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FilterSearch;
