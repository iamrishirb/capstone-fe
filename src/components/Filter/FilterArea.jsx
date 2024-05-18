import React from 'react';
import FilterDropdown from './FilterDropdown';
import FilterChip from './FilterChip';
import styles from './filters.module.css';

const FilterArea = ({
    filters,
    selectedFilters,
    onSelectFilter,
    onRemoveFilter,
}) => {
    return (
        <div className={styles["filter-area"]}>
            {filters.map((filter, index) => (
                <FilterDropdown
                    key={index}
                    label={filter.label}
                    options={filter.options}
                    selectedFilters={selectedFilters[filter.key] || []}
                    onSelectFilter={(selected) => onSelectFilter(filter.key, selected)}
                />
            ))}
            <div className={styles["selected-filters"]}>
                {Object.keys(selectedFilters).map((key) => (
                    (selectedFilters[key] || []).map((value, index) => (
                        <FilterChip key={`${key}-${index}`} filter={{ key, value }} onRemove={() => onRemoveFilter(key)} />
                    ))
                ))}
            </div>
        </div>
    );
};

export default FilterArea;
