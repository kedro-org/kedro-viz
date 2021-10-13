import React from 'react';

import './run-metadata.css';

const RunMetadata = ({ isSingleRun, runs }) => {
  return (
    <div className="details-metadata">
      {runs.map((run, i) => {
        return (
          <div className="details-metadata__run" key={run.gitSha}>
            <table>
              <tbody>
                {isSingleRun ? (
                  <td className="details-metadata__title" colSpan="2">
                    {run.title}
                  </td>
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
