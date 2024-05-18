import React from 'react';
import Select from 'react-select';
import { components } from 'react-select';
import styles from './filters.module.css';

const DropdownIndicator = (props) => {
    return (
        <components.DropdownIndicator {...props}>
            <span className="custom-dropdown-indicator">▼</span>
        </components.DropdownIndicator>
    );
};

const FilterDropdown = ({ label, options, selectedFilters, onSelectFilter }) => {
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderRadius: '5px',
            borderColor: state.isFocused ? '#80bdff' : '#ced4da',
            '&:hover': {
                borderColor: '#80bdff',
            },
        }),
    };

    const handleChange = (selectedOption) => {
        const selectedValues = selectedOption.map((option) => option.value);
        onSelectFilter(selectedValues);
    };

    const selectedOptions = selectedFilters.map((filter) => ({
        label: filter,
        value: filter,
    }));

    return (
        <div className={styles["filter-dropdown"]}>
            <label>{label}</label>
            <Select
                isMulti
                options={options.map((option) => ({ label: option, value: option }))}
                value={selectedOptions}
                onChange={handleChange}
                styles={customStyles}
                components={{ DropdownIndicator }}
                placeholder="Select..."
            />
        </div>
    );
};

export default FilterDropdown;
