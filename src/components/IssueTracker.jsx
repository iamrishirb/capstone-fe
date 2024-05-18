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
    const [workersCompleted, setWorkersCompleted] = useState(0);

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
        const workers = [];
        const dbName = 'issueTrackerDB';

        for (let i = 0; i < 4; i++) {
            const worker = new Worker(new URL('../workers/indexedDBWorker.js', import.meta.url));
            worker.onmessage = handleWorkerMessage;
            workers.push(worker);

            const jsonData = [issues0, issues1, issues2, issues3][i];
            worker.postMessage({ type: 'seedData', dbName, storeName: `issues${i}`, jsonData });
        }
    };

    const handleWorkerMessage = (event) => {
        const { status, storeName, issue, error } = event.data;
        if (status === 'progress') {
            setIssues((prevIssues) => [...prevIssues, issue]);
        } else if (status === 'completed') {
            console.log(`Data seeding completed for ${storeName}`);
            setWorkersCompleted((prevCount) => prevCount + 1);
        } else if (status === 'error') {
            console.error(`Error in worker for ${storeName}:`, error);
        }
    };

    useEffect(() => {
        if (workersCompleted === 4) {
            collectAndStoreUniqueValues();
            setIsLoading(false);
            fetchAndLogFirstTenIssues();
        }
    }, [workersCompleted]);

    const collectAndStoreUniqueValues = async () => {
        const dbRequest = indexedDB.open('issueTrackerDB', 1);
        dbRequest.onsuccess = async function (event) {
            const db = event.target.result;
            const uniqueValues = await fetchUniqueValues(db);
            setFilters(uniqueValues);
        };
        dbRequest.onerror = function (event) {
            console.error('Error opening IndexedDB for unique values:', event.target.error);
        };
    };

    const fetchUniqueValues = async (db) => {
        const uniqueValuesStore = db.transaction('uniqueValuesStore', 'readonly').objectStore('uniqueValuesStore');
        const request = uniqueValuesStore.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const result = event.target.result;
                const filters = result.map((item) => ({
                    key: item.key,
                    label: item.key.charAt(0).toUpperCase() + item.key.slice(1),
                    options: item.values,
                }));
                resolve(filters);
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    };

    const fetchAndLogFirstTenIssues = () => {
        const fetchWorker = new Worker(new URL('../workers/fetchIssuesWorker.js', import.meta.url));
        fetchWorker.onmessage = (event) => {
            const { issues } = event.data;
            console.log('First 10 issues from each store:', issues);
        };
        fetchWorker.postMessage({ type: 'fetchFirstTen', dbName: 'issueTrackerDB', storeNames: ['issues0', 'issues1', 'issues2', 'issues3'] });
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
                        <IssueLane title={"To Do"} issues={issues.filter((issue) => issue.status === 'To Do')} />
                        <IssueLane title={"In Progress"} issues={issues.filter((issue) => issue.status === 'In Progress')} />
                        <IssueLane title={"Review"} issues={issues.filter((issue) => issue.status === 'Review')} />
                        <IssueLane title={"Completed"} issues={issues.filter((issue) => issue.status === 'Completed')} />
                    </div>
                </>
            )}
        </div>
    );
};

export default IssueTracker;