import React from 'react';
import className from 'classnames';

import './preview-table.css';

const PreviewTable = ({ data, size = 'small' }) => {
  const headers = Object.keys(data);
  const nRows = Object.keys(data[headers[0]]);

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
          {headers.map((header) => (
            <th className="preview-table__header" key={header}>
              {header}
            </th>
          ))}
        </tr>
        {nRows.map((index) => (
          <tr className="preview-table__row" key={index}>
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
