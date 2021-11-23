import React, { useState } from 'react';
import classnames from 'classnames';
import { toHumanReadableTime } from '../../../utils/date-utils';

import './run-metadata.css';

const RunMetadata = ({ isSingleRun, runs = [] }) => {
  let initialState = {};
  for (let i = 0; i < runs.length; i++) {
    initialState[i] = false;
  }

  const [toggleNotes, setToggleNotes] = useState(initialState);

  const onToggleNoteExpand = (index) => {
    setToggleNotes({ ...toggleNotes, [index]: !toggleNotes[index] });
  };

  return runs.length === 0 ? (
    <div>Loading...</div>
  ) : (
    <div
      className={classnames('details-metadata', {
        'details-metadata--single': isSingleRun,
      })}>
      {runs.map((run, i) => {
        const humanReadableTime = toHumanReadableTime(run.timestamp);

        return (
          <div
            className={classnames('details-metadata__run', {
              'details-metadata__run--single': isSingleRun,
            })}
            key={run.gitSha}>
            <table className="details-metadata__table">
              <tbody>
                {isSingleRun ? (
                  <tr>
                    <td className="details-metadata__title" colSpan="2">
                      {run.title}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    {i === 0 ? <td></td> : null}
                    <td className="details-metadata__title">{run.title}</td>
                  </tr>
                )}
                <tr>
                  {i === 0 ? <td>Created By</td> : null}
                  <td>{run.author}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Creation Date</td> : null}
                  <td>{`${humanReadableTime} (${run.timestamp})`}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Git SHA</td> : null}
                  <td>{run.gitSha}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Git Branch</td> : null}
                  <td>{run.gitBranch}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Run Command</td> : null}
                  <td>{run.runCommand}</td>
                </tr>
                <tr>
                  {i === 0 ? <td>Notes</td> : null}
                  <td>
                    <p
                      className="details-metadata__notes"
                      style={toggleNotes[i] ? { display: 'block' } : null}>
                      {run.notes}
                    </p>
                    {run.notes.length > 100 ? (
                      <button
                        className="details-metadata__show-more kedro"
                        onClick={() => onToggleNoteExpand(i)}>
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
