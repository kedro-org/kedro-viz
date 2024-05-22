import classnames from 'classnames';
import UrlBox from '../url-box/url-box';
import Button from '../../ui/button';
import Dropdown from '../../ui/dropdown';
import MenuOption from '../../ui/menu-option';

import { getFilteredPlatforms } from '../utils';

const PublishedView = ({
  handleResponseUrl,
  hostingPlatformLocalStorageVal,
  hostingPlatforms,
  onChange,
  onCopyClick,
  onRepublishClick,
  platform,
  showCopied,
}) => {
  const platformsKeys = Object.keys(hostingPlatformLocalStorageVal);
  const platformsVal = Object.values(hostingPlatformLocalStorageVal);

  const url = platform
    ? hostingPlatformLocalStorageVal[platform]['endpoint']
    : platformsVal[0]['endpoint'];

  const filteredPlatforms = getFilteredPlatforms(
    hostingPlatforms,
    platformsKeys
  );
  return (
    <>
      <div className="shareable-url-modal__published">
        <div className="shareable-url-modal__content-title">
          Publish and Share Kedro-Viz
        </div>
        {platformsKeys.length === 1 ? (
          <UrlBox
            url={url}
            onClick={() => onCopyClick(url)}
            href={handleResponseUrl}
            showCopiedText={showCopied}
          />
        ) : (
          <div className="shareable-url-modal__published-dropdown-wrapper">
            <Dropdown
              defaultText={
                (platform && filteredPlatforms[platform]) ||
                Object.values(filteredPlatforms)[0]
              }
              onChanged={onChange}
              width={null}
            >
              {Object.entries(filteredPlatforms).map(([value, label]) => (
                <MenuOption
                  className={classnames({
                    'pipeline-list__option--active': platform === value,
                  })}
                  key={value}
                  primaryText={label}
                  value={value}
                />
              ))}
            </Dropdown>
            <UrlBox
              className="url-box__wrapper--half-width"
              url={url}
              onClick={onCopyClick}
              href={handleResponseUrl}
              showCopiedText={showCopied}
            />
          </div>
        )}
      </div>
      <div className="shareable-url-modal__published-action">
        <p className="shareable-url-modal__published-action-text">
          Republish Kedro-Viz to push new updates to the published link above,
          or publish a new link to share.
        </p>
        <Button mode="secondary" onClick={onRepublishClick} size="small">
          Republish
        </Button>
      </div>
    </>
  );
};

export default PublishedView;
