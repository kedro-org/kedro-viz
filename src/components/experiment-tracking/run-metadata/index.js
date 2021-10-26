import React, { useState } from 'react';
import classnames from 'classnames';

import './run-metadata.css';

const RunMetadata = ({ isSingleRun, runs }) => {
  let initialState = {};
  for (let i = 0; i < runs.length; i++) {
    initialState[i] = false;
  }

  const [expandNotes, setExpandNotes] = useState(initialState);

  const onShowMoreClick = (key) => {
    setExpandNotes({ ...expandNotes, [key]: true });
  };

  return (
    <div
      className={classnames('details-metadata', {
        'details-metadata--single': isSingleRun,
      })}
    >
      {runs.map((run, i) => {
        const { metadata } = run;

        return (
          <div
            className={classnames('details-metadata__run', {
              'details-metadata__run--single': isSingleRun,
            })}
            key={metadata.gitSha}
          >
            <table className="details-metadata__table">
              <tbody>
                {isSingleRun ? (
                  <tr>
                    <td className="details-metadata__title" colSpan="2">
                      {metadata.title}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    {i === 0 ? <td></td> : null}
                    <td className="details-metadata__title">
                      {metadata.title}
                    </td>
                  </tr>
                )}
                <tr>
                  {i === 0 ? <td>Created By</td> : null}
                  <td>{metadata.author}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Creation Date</td> : null}
                  <td>{metadata.timestamp}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Git SHA</td> : null}
                  <td>{metadata.gitSha}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Git Branch</td> : null}
                  <td>{metadata.gitBranch}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Run Command</td> : null}
                  <td>{metadata.runCommand}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Notes</td> : null}
                  <td>
                    <p
                      className="details-metadata__notes"
                      style={expandNotes[i] ? { display: 'block' } : null}
                    >
                      {metadata.notes}
                    </p>
                    {metadata.notes.length > 100 && !expandNotes[i] ? (
                      <button
                        className="details-metadata__show-more kedro"
                        onClick={() => onShowMoreClick(i)}
                      >
                        Show more
                      </button>
                    ) : null}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default RunMetadata;
