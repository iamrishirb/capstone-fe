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
    'Feature': '✨',
    'Enhancement': '🛠️',
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <p className={`${styles.status} ${styles[issue.status.replace(' ', '')]}`}>
                    {statusEmojis[issue.status]} {issue.status}
                </p>
                <p className={`${styles.category} ${styles[issue.category]}`}>
                    {categoryEmojis[issue.category]} {issue.category}
                </p>
                <p className={`${styles.priority} ${styles[issue.priority]}`}>
                    {priorityEmojis[issue.priority]} {issue.priority}
                </p>
            </div>
            <p>
                <strong>Team:</strong> {issue.team}
            </p>
            <p>
                <strong>Tags:</strong> {issue.tag.join(', ')}
            </p>
        </div>
    );
};

export default IssueCard;
