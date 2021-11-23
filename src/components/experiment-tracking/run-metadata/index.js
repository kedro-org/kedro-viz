import React, { useState } from 'react';
import classnames from 'classnames';
import { toHumanReadableTime } from '../../../utils/date-utils';

import './run-metadata.css';

// checks if value is an empty string, which is the default value returned
// by the graphql endpoint for empty values
const checkEmptyValue = (value) => (value !== '' ? value : '-');

const RunMetadata = ({ isSingleRun, runs = [] }) => {
  let initialState = {};
  for (let i = 0; i < runs.length; i++) {
    initialState[i] = false;
  }

  const [toggleNotes, setToggleNotes] = useState(initialState);

  const onToggleNoteExpand = (index) => {
    setToggleNotes({ ...toggleNotes, [index]: !toggleNotes[index] });
  };

  return (
    <div
      className={classnames('details-metadata', {
        'details-metadata--single': isSingleRun,
      })}
    >
      {runs.map((run, i) => {
        const humanReadableTime = toHumanReadableTime(run.timestamp);

        return (
          <div
            className={classnames('details-metadata__run', {
              'details-metadata__run--single': isSingleRun,
            })}
            key={run.title}
          >
            <table className="details-metadata__table">
              <tbody>
                {isSingleRun ? (
                  <tr>
                    <td className="details-metadata__title" colSpan="2">
                      {checkEmptyValue(run.title)}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    {i === 0 ? <td></td> : null}
                    <td className="details-metadata__title">
                      {checkEmptyValue(run.title)}
                    </td>
                  </tr>
                )}
                <tr>
                  {i === 0 ? <td>Created By</td> : null}
                  <td>{checkEmptyValue(run.author)}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Creation Date</td> : null}
                  <td>{`${humanReadableTime} (${checkEmptyValue(
                    run.timestamp
                  )})`}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Git SHA</td> : null}
                  <td>{checkEmptyValue(run.gitSha)}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Git Branch</td> : null}
                  <td>{checkEmptyValue(run.gitBranch)}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Run Command</td> : null}
                  <td>{checkEmptyValue(run.runCommand)}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Notes</td> : null}
                  <td>
                    <p
                      className="details-metadata__notes"
                      style={toggleNotes[i] ? { display: 'block' } : null}
                    >
                      {checkEmptyValue(run.notes)}
                    </p>
                    {run.notes.length > 100 ? (
                      <button
                        className="details-metadata__show-more kedro"
                        onClick={() => onToggleNoteExpand(i)}
                      >
                        {toggleNotes[i] ? 'Show less' : 'Show more'}
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
