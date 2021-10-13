import React from 'react';
import classnames from 'classnames';

import './run-metadata.css';

const RunMetadata = ({ isSingleRun, runs }) => {
  return (
    <div
      className={classnames('details-metadata', {
        'details-metadata--single': isSingleRun,
      })}
    >
      {runs.map((run, i) => {
        return (
          <div
            className={classnames('kedro', 'details-metadata__run', {
              'details-metadata__run--single': isSingleRun,
            })}
            key={run.gitSha}
          >
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
                  <td>{run.timestamp}</td>
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
                  <td>{run.notes}</td>
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
