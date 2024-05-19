import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import styles from './issues.module.css';
import IssueCard from './IssueCard'

const IssueLane = ({ title, issues }) => {
    const [displayedIssues, setDisplayedIssues] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const itemsPerPage = 20;

    useEffect(() => {
        setDisplayedIssues(issues.slice(0, itemsPerPage));
    }, [issues]);

    const loadMore = (page) => {
        const newIssues = issues.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
        setDisplayedIssues((prevIssues) => [...prevIssues, ...newIssues]);

        if (displayedIssues.length + newIssues.length >= issues.length) {
            setHasMore(false);
        }
    };

    console.log("issues in ", title);
    console.log(issues)

    return (
        <div className={styles['issue-lane']}>
            <h2 className={styles['lane-header']}>{title}</h2>
            <InfiniteScroll
                pageStart={0}
                loadMore={loadMore}
                hasMore={hasMore}
                loader={<div className={"loader"} key={0}>Loading ...</div>}
            >
                <div className={styles["issue-list"]}>
                    {displayedIssues.map((issue) => (
                        // <div key={issue.id} className={styles.issue}>
                        //     <h3>{issue.title}</h3>
                        //     <p>{issue.description}</p>
                        // </div>
                        <IssueCard key={issue.id} issue={issue} />
                    ))}
                </div>
            </InfiniteScroll>
        </div>
    );
};

export default IssueLane;