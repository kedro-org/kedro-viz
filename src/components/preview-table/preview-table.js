import React from 'react';

import './preview-table.css';

const PreviewTable = ({ data }) => {
  const headers = Object.keys(data);
  const nCols = Object.keys(data[headers[0]]);

  return (
    <table className="preview-table">
      <tbody>
        <tr className="preview-table__row">
          {headers.map((header) => (
            <th className="preview-table__header" key={header}>
              {header}
            </th>
          ))}
        </tr>
        {nCols.map((index) => (
          <tr key={index}>
            {headers.map((header, i) => {
              return (
                <td className="preview-table__data" key={i}>
                  {data[header][index]}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PreviewTable;
