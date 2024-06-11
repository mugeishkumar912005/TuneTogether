import React from "react";

const VotePoll = ({ usernames, name }) => {
    return (
        <div className="votepoll-container">
            <h3 className="heading">Participants</h3>
            <div className="participants-list">
                {usernames && Array.isArray(usernames) && usernames.map((username, index) => (
                    <div key={index} className="participant">{username}</div>
                ))}
                <div className="participant">{name}</div>
            </div>
        </div>
    );
};


export default VotePoll;