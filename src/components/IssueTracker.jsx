import React, { useEffect, useState } from 'react';
import issues0 from '../data/issues-0.json';
import issues1 from '../data/issues-1.json';
import issues2 from '../data/issues-2.json';
import issues3 from '../data/issues-3.json';
import { queryIssuesFromIndexedDB } from '../utils/queryIssuesFromIndexedDB';
import FilterArea from './Filter/FilterArea';
import IssueLane from './Issue/IssueLane';

const IssueTracker = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [issues, setIssues] = useState([]);
    const [filters, setFilters] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [selectedFilters, setSelectedFilters] = useState({});

    const onSelectFilter = (key, selected) => {
        setSelectedFilters((prevFilters) => ({
            ...prevFilters,
            [key]: selected,
        }));
    };

    const onRemoveFilter = (key) => {
        setSelectedFilters((prevFilters) => {
            const updatedFilters = { ...prevFilters };
            delete updatedFilters[key];
            return updatedFilters;
        });
    };

    useEffect(() => {
        parseAndStoreJSONFiles();
    }, []);

    const parseAndStoreJSONFiles = async () => {
        try {
            const request = indexedDB.open('issueTrackerDB', 1);

            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                createObjectStores(db);
            };

            request.onsuccess = async function (event) {
                const db = event.target.result;
                await seedDataIfNeeded(db, issues0, 'issues0');
                await seedDataIfNeeded(db, issues1, 'issues1');
                await seedDataIfNeeded(db, issues2, 'issues2');
                await seedDataIfNeeded(db, issues3, 'issues3');
                await collectAndStoreUniqueValues(db);
                setFilters(await fetchUniqueValues(db));
                setIsLoading(false);
            };

            request.onerror = function (event) {
                console.error('Error opening IndexedDB:', event.target.error);
                setIsLoading(false);
            };
        } catch (error) {
            console.error('Error parsing JSON files or storing data in IndexedDB:', error);
            setIsLoading(false);
        }
    };

    const seedDataIfNeeded = async (db, jsonData, storeName) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const countRequest = objectStore.count();

            countRequest.onsuccess = async () => {
                if (countRequest.result === 0) {
                    console.log(`Seeding data in ${storeName}`);
                    try {
                        await storeData(db, jsonData, storeName);
                        resolve();
                    } catch (error) {
                        console.error(`Error seeding data in ${storeName}:`, error);
                        reject(error);
                    }
                } else {
                    console.log(`Data already exists in ${storeName}, skipping seeding.`);
                    resolve();
                }
            };

            countRequest.onerror = (event) => {
                console.error(`Error counting data in IndexedDB (${storeName}):`, event.target.error);
                reject(event.target.error);
            };
        });
    };

    const storeData = (db, jsonData, storeName) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);

            transaction.oncomplete = () => {
                console.log(`Data stored in IndexedDB (${storeName}) successfully`);
                resolve();
            };

            transaction.onerror = (event) => {
                console.error(`Error storing data in IndexedDB (${storeName}):`, event.target.error);
                reject(event.target.error);
            };

            jsonData.forEach((issue, index) => {
                const addRequest = objectStore.add(issue);
                addRequest.onsuccess = () => {
                    console.log(`Added issue ${index + 1}/${jsonData.length} to ${storeName}`);
                };
                addRequest.onerror = (event) => {
                    console.error(`Error adding data to IndexedDB (${storeName}):`, event.target.error);
                    reject(event.target.error);
                };
            });
        });
    };

    const createObjectStores = (db) => {
        try {
            for (let i = 0; i < 4; i++) {
                const storeName = `issues${i}`;
                if (!db.objectStoreNames.contains(storeName)) {
                    const objectStore = db.createObjectStore(storeName, { keyPath: 'id' });
                    objectStore.createIndex('title', 'title', { unique: false });
                    objectStore.createIndex('status', 'status', { unique: false });
                    objectStore.createIndex('category', 'category', { unique: false });
                    objectStore.createIndex('priority', 'priority', { unique: false });
                    objectStore.createIndex('team', 'team', { unique: false });
                    objectStore.createIndex('tag', 'tag', { unique: false, multiEntry: true });
                }
            }
            if (!db.objectStoreNames.contains('uniqueValuesStore')) {
                db.createObjectStore('uniqueValuesStore', { keyPath: 'key' });
            }
        } catch (error) {
            console.error('Error creating object stores:', error);
        }
    };

    const collectAndStoreUniqueValues = async (db) => {
        const uniqueValues = {
            category: new Set(),
            team: new Set(),
            tag: new Set(),
            status: new Set(),
        };

        const promises = [];
        for (let i = 0; i < 4; i++) {
            const storeName = `issues${i}`;
            promises.push(new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readonly');
                const objectStore = transaction.objectStore(storeName);
                const request = objectStore.openCursor();

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const { category, team, tag, status } = cursor.value;
                        uniqueValues.category.add(category);
                        uniqueValues.team.add(team);
                        uniqueValues.status.add(status);
                        if (Array.isArray(tag)) {
                            tag.forEach(t => uniqueValues.tag.add(t));
                        } else {
                            uniqueValues.tag.add(tag);
                        }
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };

                request.onerror = (event) => {
                    console.error(`Error collecting unique values from ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            }));
        }

        await Promise.all(promises);

        const uniqueValuesData = Object.keys(uniqueValues).map(key => ({
            key,
            values: Array.from(uniqueValues[key]),
        }));

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['uniqueValuesStore'], 'readwrite');
            const objectStore = transaction.objectStore('uniqueValuesStore');

            transaction.oncomplete = () => {
                console.log('Unique values stored successfully');
                resolve();
            };

            transaction.onerror = (event) => {
                console.error('Error storing unique values:', event.target.error);
                reject(event.target.error);
            };

            uniqueValuesData.forEach(item => {
                const addRequest = objectStore.put(item);
                addRequest.onerror = (event) => {
                    console.error('Error adding unique value to store:', event.target.error);
                    reject(event.target.error);
                };
            });
        });
    };

    const fetchUniqueValues = (db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['uniqueValuesStore'], 'readonly');
            const objectStore = transaction.objectStore('uniqueValuesStore');
            const request = objectStore.getAll();

            request.onsuccess = (event) => {
                const result = event.target.result;
                const filters = result.map(item => ({
                    key: item.key,
                    label: item.key.charAt(0).toUpperCase() + item.key.slice(1),
                    options: item.values,
                }));
                resolve(filters);
            };

            request.onerror = (event) => {
                console.error('Error fetching unique values:', event.target.error);
                reject(event.target.error);
            };
        });
    };

    useEffect(() => {
        const fetchDataFromIndexedDB = async () => {
            try {
                const issues = await queryIssuesFromIndexedDB(pageNumber, pageSize, selectedFilters);
                setIssues(issues);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data from IndexedDB:', error);
                setIsLoading(false);
            }
        };

        fetchDataFromIndexedDB();
    }, [pageNumber, pageSize, selectedFilters]);

    return (
        <div>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <FilterArea
                        filters={filters}
                        selectedFilters={selectedFilters}
                        onSelectFilter={onSelectFilter}
                        onRemoveFilter={onRemoveFilter}
                    />
                    <div className="lane-area">
                        <IssueLane title={"To Do"} issues={issues.filter(issue => issue.status === 'To Do')} />
                        <IssueLane title={"In Progress"} issues={issues.filter(issue => issue.status === 'In Progress')} />
                        <IssueLane title={"Review"} issues={issues.filter(issue => issue.status === 'Review')} />
                        <IssueLane title={"Completed"} issues={issues.filter(issue => issue.status === 'Completed')} />
                    </div>
                </>
            )}
        </div>
    );
};

export default IssueTracker;