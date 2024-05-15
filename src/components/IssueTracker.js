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
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const filters = [
        { key: 'category', label: 'Category', options: ['Bug', 'Feature', 'Enhancement', 'Question'] },
        { key: 'priority', label: 'Priority', options: ['Low', 'Medium', 'High', 'Critical'] },
        { key: 'team', label: 'Team', options: ['Team A', 'Team B', 'Team C'] },
        { key: 'tag', label: 'Tag', options: ['Tag 1', 'Tag 2', 'Tag 3'] },
    ];

    const selectedFilters = {};

    const onSelectFilter = (key, selected) => {
        selectedFilters[key] = selected;
    };

    const onRemoveFilter = (key) => {
        delete selectedFilters[key];
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

            jsonData.forEach(issue => {
                const addRequest = objectStore.add(issue);
                addRequest.onerror = (event) => {
                    console.error(`Error adding data to IndexedDB (${storeName}):`, event.target.error);
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
                }
            }
        } catch (error) {
            console.error('Error creating object stores:', error);
        }
    };

    useEffect(() => {
        const fetchDataFromIndexedDB = async () => {
            try {
                const issues = await queryIssuesFromIndexedDB(pageNumber, pageSize);
                console.log('Fetched issues:', issues);
                setIssues(issues);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data from IndexedDB:', error);
                setIsLoading(false);
            }
        };

        fetchDataFromIndexedDB();
    }, [pageNumber, pageSize]);

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
                    <IssueLane title={"To Do"} issues={issues.filter(issue => issue.status === 'todo')} />
                    <IssueLane title={"Doing"} issues={issues.filter(issue => issue.status === 'doing')} />
                    <IssueLane title={"Done"} issues={issues.filter(issue => issue.status === 'done')} />
                </>
            )}
        </div>
    );
};

export default IssueTracker;
