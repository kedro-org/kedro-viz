import React from 'react';

import './preview-table.css';

const PreviewTable = ({ data }) => {
  const headers = Object.keys(data);
  const nCols = Object.keys(data[headers[0]]);

  return (
    <table>
      <tbody>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
        {nCols.map((index) => (
          <tr key={index}>
            {headers.map((header, i) => {
              return <td key={i}>{data[header][index]}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PreviewTable;
