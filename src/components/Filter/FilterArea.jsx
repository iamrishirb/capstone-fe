import React, { useEffect, useState } from 'react';
import FilterDropdown from './FilterDropdown';
import FilterChip from './FilterChip';
import styles from './filters.module.css';

const FilterArea = ({
    selectedFilters,
    onSelectFilter,
    onRemoveFilter,
}) => {
    const [teams, setTeams] = useState([]);
    const [tags, setTags] = useState([]);

    useEffect(() => {
        const fetchTeamsAndTags = async () => {
            const dbRequest = indexedDB.open('issueTrackerDB', 11);

            dbRequest.onsuccess = async (event) => {
                const db = event.target.result;

                const teamsTransaction = db.transaction('teams', 'readonly');
                const teamsStore = teamsTransaction.objectStore('teams');
                const teamsRequest = teamsStore.getAll();
                teamsRequest.onsuccess = (event) => {
                    setTeams(event.target.result.map(team => team.id));
                };
                teamsRequest.onerror = (event) => {
                    console.error('Error fetching teams from IndexedDB:', event.target.error);
                };

                const tagsTransaction = db.transaction('tags', 'readonly');
                const tagsStore = tagsTransaction.objectStore('tags');
                const tagsRequest = tagsStore.getAll();
                tagsRequest.onsuccess = (event) => {
                    setTags(event.target.result.map(tag => tag.id));
                };
                tagsRequest.onerror = (event) => {
                    console.error('Error fetching tags from IndexedDB:', event.target.error);
                };
            };

            dbRequest.onerror = (event) => {
                console.error('Error opening IndexedDB:', event.target.error);
            };
        };

        fetchTeamsAndTags();
    }, []);

    const filterOptions = [
        { key: 'category', label: 'Filter By Category', options: ["Bug", "Feature", "Enhancement", "Question"] },
        { key: 'priority', label: 'Filter By Priority', options: ["Low", "Medium", "High", "Critical"] },
        { key: 'team', label: 'Filter By Team', options: teams },
        { key: 'tag', label: 'Filter By Tag', options: tags }
    ];

    return (
        <div className={styles["filter-area"]}>
            <div className={styles["filter-group"]}>
                {filterOptions.map((filter, index) => (
                    <div key={index} className={styles["filter-column"]}>
                        <FilterDropdown
                            label={filter.label}
                            options={filter.options}
                            selectedFilters={selectedFilters[filter.key] || []}
                            onSelectFilter={(selected) => onSelectFilter(filter.key, selected)}
                        />
                    </div>
                ))}
            </div>
            <div className={styles["selected-filters"]}>
                {Object.keys(selectedFilters).map((key) => (
                    selectedFilters[key].map((value, index) => (
                        <FilterChip key={`${key}-${index}`} filter={value} onRemove={() => onRemoveFilter(key, value)} />
                    ))
                ))}
            </div>
        </div>
    );
};

export default FilterArea;
