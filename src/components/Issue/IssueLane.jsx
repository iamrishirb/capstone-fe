import React from 'react';
import IssueList from './IssueList';
import IssueSearch from './IssueSearch';
import styles from './issues.module.css';

const IssueLane = ({ title, issues }) => {
    return (
        <div className={styles["issue-lane"]}>
            <div className={styles["lane-header"]}>
                <h2>{title}</h2>
                <IssueSearch issues={issues} />
            </div>
            <div className={styles["lane-body"]}>
                <IssueList issues={issues} />
            </div>
        </div>
    );
};

export default IssueLane;
