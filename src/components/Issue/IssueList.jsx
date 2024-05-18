import React from 'react';
import IssueCard from './IssueCard';
import styles from './issues.module.css';

const IssueList = ({ issues }) => {
    return (
        <div className={styles["issue-list"]}>
            {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
            ))}
        </div>
    );
};

export default IssueList;
