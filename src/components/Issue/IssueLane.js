// src/components/Issue/IssueLane.js

import React from 'react';
import IssueList from './IssueList';
import IssueSearch from './IssueSearch';

const IssueLane = ({ title, issues }) => {
    return (
        <div className="issue-lane">
            <div className="lane-header">
                <h2>{title}</h2>
                <IssueSearch issues={issues} />
            </div>
            <div className="lane-body">
                <IssueList issues={issues} />
            </div>
        </div>
    );
};

export default IssueLane;
