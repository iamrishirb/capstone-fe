import React, { useEffect, useState } from 'react';
import issues0 from '../data/issues-0.json';
import issues1 from '../data/issues-1.json';
import issues2 from '../data/issues-2.json';
import issues3 from '../data/issues-3.json';
import FilterArea from './Filter/FilterArea';
import IssueLane from './Issue/IssueLane';
import { queryIssuesFromIndexedDB } from '../utils/queryIssuesFromIndexedDB';

const dbName = 'issueTrackerDB';
const dbVersion = 9;

const IssueTracker = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [issues, setIssues] = useState([]);
    const [filters, setFilters] = useState([]);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [workersCompleted, setWorkersCompleted] = useState(0);
    const [teams, setTeams] = useState({});

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

    const filterJSONData = (data) => {
        return data.slice(0, 200);
    };

    const parseAndStoreJSONFiles = async () => {
        const workers = [];

        const jsonDataArray = [
            filterJSONData(issues0),
            filterJSONData(issues1),
            filterJSONData(issues2),
            filterJSONData(issues3),
        ];

        const dbRequest = indexedDB.open(dbName, dbVersion);

        dbRequest.onupgradeneeded = function (event) {
            const db = event.target.result;
            for (let i = 0; i < jsonDataArray.length; i++) {
                const storeName = `issues${i}`;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            }
        };

        dbRequest.onsuccess = function (event) {
            const db = event.target.result;
            for (let i = 0; i < jsonDataArray.length; i++) {
                const worker = new Worker(new URL('../workers/indexedDBWorker.js', import.meta.url));
                worker.onmessage = handleWorkerMessage;
                workers.push(worker);

                const jsonData = jsonDataArray[i];
                worker.postMessage({ type: 'seedData', dbName, storeName: `issues${i}`, jsonData, dbVersion });
            }

            // Start the team worker
            const teamWorker = new Worker(new URL('../workers/teamWorker.js', import.meta.url));
            teamWorker.onmessage = handleTeamWorkerMessage;
            teamWorker.postMessage({ jsonDataArray });
        };

        dbRequest.onerror = function (event) {
            console.error('Error opening IndexedDB:', event.target.error);
        };
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

    const handleTeamWorkerMessage = (event) => {
        const { teams } = event.data;
        setTeams(teams);
        console.log('Teams data:', teams);
    };

    useEffect(() => {
        if (workersCompleted === 4) {
            setIsLoading(false);
            fetchDataFromIndexedDB();
        }
    }, [workersCompleted]);

    const fetchDataFromIndexedDB = async () => {
        try {
            const allIssues = [];
            const dbRequest = indexedDB.open(dbName, dbVersion);
            dbRequest.onsuccess = async function (event) {
                const db = event.target.result;
                const storeNames = ['issues0', 'issues1', 'issues2', 'issues3'];
                for (const storeName of storeNames) {
                    const transaction = db.transaction(storeName, 'readonly');
                    const objectStore = transaction.objectStore(storeName);
                    const request = objectStore.getAll();

                    request.onsuccess = (event) => {
                        allIssues.push(...event.target.result);
                    };

                    request.onerror = (event) => {
                        console.error('Error fetching data from IndexedDB:', event.target.error);
                    };

                    await transaction.complete;
                }
                setIssues(allIssues);
                setIsLoading(false);
            };

            dbRequest.onerror = function (event) {
                console.error('Error opening IndexedDB:', event.target.error);
                setIsLoading(false);
            };
        } catch (error) {
            console.error('Error fetching data from IndexedDB:', error);
            setIsLoading(false);
        }
    };

    const filterIssuesByStatus = (status) => {
        return issues.filter(issue => issue.status === status);
    };

    console.log('All issues:', issues);

    return (
        <div className='issue-tracker'>
            {isLoading ? (
                <div className='loading-screen'>
                    <dotlottie-player src="https://lottie.host/88c4fcc9-4a9e-47c2-b73f-4b3b5a03ef38/d1daYtUo0K.lottie"
                        background="transparent" speed="1" loop autoplay></dotlottie-player>
                </div>
            ) : (
                <>
                    <FilterArea
                        filters={filters}
                        selectedFilters={selectedFilters}
                        onSelectFilter={onSelectFilter}
                        onRemoveFilter={onRemoveFilter}
                    />
                    <div className='lane-area'>
                        <IssueLane title='To-Do' issues={filterIssuesByStatus('To Do')} />
                        <IssueLane title='In Progress' issues={filterIssuesByStatus('In Progress')} />
                        <IssueLane title='Review' issues={filterIssuesByStatus('Review')} />
                        <IssueLane title='Completed' issues={filterIssuesByStatus('Completed')} />
                    </div>
                </>
            )}
        </div>
    );
};

export default IssueTracker;