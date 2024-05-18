import React from 'react';
import IssueSearch from './IssueSearch';
import styles from './issues.module.css';
import IssueList from './IssueList'

const IssueLane = ({ title, issues }) => {
    console.log("tesr ")
    return (
        <div className={styles["issue-lane"]}>
            <div className={styles["lane-header"]}>
                <h2>{title}</h2>
                {/* <IssueSearch issues={issues} /> */}
            </div>
            <div className={styles["lane-body"]}>
                <IssueList issues={issues} />
            </div>
        </div>
    );
};

export default IssueLane;
