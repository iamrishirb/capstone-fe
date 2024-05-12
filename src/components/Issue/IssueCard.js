import React from 'react';

const IssueCard = ({ issue }) => {
    return (
        <div className="issue-card">
            <h3>{issue.title}</h3>
            <p>
                <strong>Status:</strong> {issue.status}
            </p>
            <p>
                <strong>Category:</strong> {issue.category}
            </p>
            <p>
                <strong>Priority:</strong> {issue.priority}
            </p>
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
