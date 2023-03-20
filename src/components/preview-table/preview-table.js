import React from 'react';
import className from 'classnames';

import './preview-table.css';

const PreviewTable = ({ data, size = 'small', onClick }) => {
  const tableHeaders = Object.keys(data);
  const tableRowsIndexes = Object.keys(data[tableHeaders[0]]);

  return (
    <table
      className={className('preview-table', {
        'preview-table__small': size === 'small',
        'preview-table__large': size === 'large',
      })}
      cellSpacing={0}
    >
      <tbody>
        <tr className="preview-table__row-header">
          {tableHeaders.map((header) => (
            <th
              className="preview-table__header"
              key={header}
              onClick={onClick}
            >
              {header}
            </th>
          ))}
        </tr>
        {tableRowsIndexes.map((index) => (
          <tr className="preview-table__row" key={index}>
            {tableHeaders.map((header, i) => {
              return (
                <td className="preview-table__data" key={i} onClick={onClick}>
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
