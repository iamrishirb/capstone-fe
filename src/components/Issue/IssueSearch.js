// src/components/Search.js

import React, { useState, useEffect } from 'react';

const IssueSearch = ({ issues, onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        // Function to perform search on the provided issues
        const performSearch = () => {
            setIsSearching(true);
            // Simulating asynchronous search process with setTimeout
            setTimeout(() => {
                const results = issues.filter((issue) =>
                    issue.title.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setSearchResults(results);
                setIsSearching(false);
            }, 500); // Simulate search delay for demonstration purposes (can be adjusted)
        };

        // Perform search when searchTerm changes
        performSearch();
    }, [issues, searchTerm]);

    const handleChange = (event) => {
        setSearchTerm(event.target.value);
    };

    return (
        <div className="search">
            <input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={handleChange}
            />
            {isSearching && <div className="spinner">Searching...</div>}
            <ul>
                {searchResults.map((result) => (
                    <li key={result.id}>{result.title}</li>
                ))}
            </ul>
        </div>
    );
};

export default IssueSearch;
