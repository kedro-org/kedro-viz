import React, { useState } from 'react';
import className from 'classnames';

import './table-renderer.scss';

const TableRenderer = ({ data, size = 'small', onClick }) => {
  const [hoveredHeaderIndex, setHoveredHeaderIndex] = useState(null);

  return (
    <table
      className={className('pipeline-table-renderer', {
        'pipeline-table-renderer__small': size === 'small',
        'pipeline-table-renderer__large': size === 'large',
      })}
      cellSpacing={0}
    >
      <tbody>
        <tr className="pipeline-table-renderer__row-header">
          {data.columns?.map((column, index) => (
            <th
              className="pipeline-table-renderer__header"
              key={column}
              onClick={onClick}
              onMouseOut={() => setHoveredHeaderIndex(null)}
              onMouseOver={() => setHoveredHeaderIndex(index)}
            >
              {column}
            </th>
          ))}
        </tr>
        {data.data?.map((row, index) => (
          <tr className="pipeline-table-renderer__row" key={index}>
            {row.map((content, i) => (
              <td
                className={className('pipeline-table-renderer__data', {
                  'pipeline-table-renderer__data-hovered':
                    i === hoveredHeaderIndex,
                })}
                key={i}
                onClick={onClick}
              >
                {String(content)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableRenderer;
