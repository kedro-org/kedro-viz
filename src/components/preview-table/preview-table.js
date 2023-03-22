import React from 'react';
import className from 'classnames';

import './preview-table.css';

const PreviewTable = ({ data, size = 'small', onClick }) => {
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
          {data.columns?.map((column) => (
            <th
              className="preview-table__header"
              key={column}
              onClick={onClick}
            >
              {column}
            </th>
          ))}
        </tr>
        {data.data?.map((row, index) => (
          <tr className="preview-table__row" key={index}>
            {row.map((content, i) => (
              <td className="preview-table__data" key={i} onClick={onClick}>
                {content}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PreviewTable;
