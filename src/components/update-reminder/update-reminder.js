import React, { useState } from 'react';
import classnames from 'classnames';
import './update-reminder.css';

const UpdateReminder = ({ versions, setDismiss }) => {
  const [expand, setExpand] = useState(false);
  const { latest } = versions;

  // expanded version of the update reminder
  if (expand) {
    return (
      <div>
        <div className="update-reminder-expanded">
          <button className="kedro" onClick={() => setExpand(false)}>
            <p>Kedro-Viz {latest} is here </p>
          </button>
        </div>
        <div className="expanded-detail">hello</div>
      </div>
    );
  }

  return (
    <div className="update-reminder-unexpanded">
      <button className="kedro" onClick={() => setExpand(true)}>
        <p>Kedro-Viz {latest} is here </p>
      </button>
      <button className="kedro" onClick={() => setExpand(true)}>
        Dismiss
      </button>
    </div>
  );
};

export default UpdateReminder;
