import classnames from 'classnames';
import Tooltip from '../../ui/tooltip';
import Button from '../../ui/button';

import './url-box.scss';

const UrlBox = ({ className, url, onClick, href, showCopiedText }) => (
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
      <div className="url-box___button">
        <Button
          mode="secondary"
          onClick={onClick}
          size="small"
          dataHeapEvent={`clicked.run_command`}
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