import React from 'react';
import classnames from 'classnames';
import Tooltip from '../../ui/tooltip';
import Button from '../../ui/button';

import './url-box.scss';

const UrlBox = ({
  className,
  url,
  onCopyClick,
  href,
  showCopiedText,
  dataTest,
}) => (
  <div
    className={classnames('url-box__wrapper', {
      [`${className}`]: className,
    })}
  >
    <div className="url-box__result-url-wrapper">
      <a
        className="url-box__result-url"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {url}
      </a>
    </div>
    {window.navigator.clipboard && (
      <div
        className={classnames('url-box___button', {
          'url-box__button-copied': showCopiedText,
        })}
      >
        <Button
          onClick={() => onCopyClick(url)}
          size="small"
          dataTest={dataTest}
        >
          Copy link
        </Button>
        <Tooltip
          text="Copied!"
          visible={showCopiedText}
          noDelay
          centerArrow
          arrowSize="small"
        />
      </div>
    )}
  </div>
);

export default UrlBox;
