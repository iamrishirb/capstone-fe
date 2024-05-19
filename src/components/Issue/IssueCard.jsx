import React from 'react';
import styles from './issues.module.css';

const statusEmojis = {
    'To Do': '📝',
    'In Progress': '🚧',
    'Review': '🔍',
    'Completed': '✅'
};

const categoryEmojis = {
    'Bug': '🐛',
    'Feature': '🚩',
    'Enhancement': '💡',
    'Question': '❓'
};

const priorityEmojis = {
    'Low': '🟢',
    'Medium': '🟡',
    'High': '🔴',
    'Critical': '🔥'
};

const IssueCard = ({ issue }) => {
    return (
        <div className={styles.issueCard}>
            <h3>{issue.title}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {/* <p className={`${styles.status} ${styles[issue.status.replace(' ', '')]}`}>
                    {statusEmojis[issue.status]} {issue.status}
                </p> */}
                <p className={`${styles.category} ${styles[issue.category]}`}>
                    {categoryEmojis[issue.category]} {issue.category}
                </p>
                <p className={`${styles.priority} ${styles[issue.priority]}`}>
                    {priorityEmojis[issue.priority]} {issue.priority}
                </p>
            </div>
            <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    <img width="18" height="18" src="https://img.icons8.com/material-sharp/24/conference-background-selected.png" alt="conference-background-selected" />
                    <p className={styles.team}>
                        {issue.team}
                    </p>
                </div>
                {issue.tag && issue.tag.length > 0 && (
                    <div className={styles.tags}>
                        <img width="20" height="20" src="https://img.icons8.com/fluency-systems-filled/48/price-tag.png" alt="price-tag" />
                        {issue.tag.map((tag, index) => (
                            <span key={index} className={styles.tagPill}>{tag}</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IssueCard;