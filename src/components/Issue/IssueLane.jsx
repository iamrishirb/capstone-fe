import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import styles from './issues.module.css';
import IssueCard from './IssueCard';

const IssueLane = ({ title, issues }) => {
    const [displayedIssues, setDisplayedIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const itemsPerPage = 20;

    useEffect(() => {
        setFilteredIssues(issues);
        setDisplayedIssues(issues.slice(0, itemsPerPage));
        setHasMore(issues.length > itemsPerPage);
    }, [issues]);

    const loadMore = (page) => {
        const startIndex = page * itemsPerPage;
        const newIssues = filteredIssues.slice(startIndex, startIndex + itemsPerPage);
        setDisplayedIssues((prevIssues) => [...prevIssues, ...newIssues]);

        if (startIndex + itemsPerPage >= filteredIssues.length) {
            setHasMore(false);
        }
    };

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);
        const searchResults = issues.filter(issue =>
            issue.title.toLowerCase().includes(query) ||
            issue.team.toLowerCase().includes(query) ||
            issue.tag.some(tag => tag.toLowerCase().includes(query))
        );
        setFilteredIssues(searchResults);
        setDisplayedIssues(searchResults.slice(0, itemsPerPage));
        setHasMore(searchResults.length > itemsPerPage);
    };

    return (
        <div className={styles['issue-lane']}>
            <h2 className={styles['lane-header']}>{title}</h2>
            <div className={styles['typeahead-container']}>
                <input
                    type="text"
                    placeholder="🔍  Search issues..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className={styles['search-bar']}
                />
            </div>
            <InfiniteScroll
                pageStart={0}
                loadMore={loadMore}
                hasMore={hasMore}
                loader={<div className={"loader"} key={0}>Loading ...</div>}
            >
                <div className={styles["issue-list"]}>
                    {displayedIssues.map((issue) => (
                        <IssueCard key={issue.id} issue={issue} />
                    ))}
                </div>
            </InfiniteScroll>
        </div>
    );
};

export default IssueLane;