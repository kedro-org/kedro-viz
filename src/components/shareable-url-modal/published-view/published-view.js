import React from 'react';
import classnames from 'classnames';
import UrlBox from '../url-box/url-box';
import Button from '../../ui/button';
import Dropdown from '../../ui/dropdown';
import MenuOption from '../../ui/menu-option';

import { getFilteredPlatforms, handleResponseUrl } from '../utils';

const PublishedView = ({
  hostingPlatformLocalStorageVal,
  hostingPlatforms,
  onChange,
  onCopyClick,
  onRepublishClick,
  platform,
  showCopied,
}) => {
  const platformsKeysFromLocalStorage = Object.keys(
    hostingPlatformLocalStorageVal
  );
  const platformsValFromLocalStorage = Object.values(
    hostingPlatformLocalStorageVal
  );

  const url = platform
    ? hostingPlatformLocalStorageVal[platform]['endpoint']
    : platformsValFromLocalStorage[0]['endpoint'];

  const filteredPlatforms = getFilteredPlatforms(
    hostingPlatforms,
    platformsKeysFromLocalStorage
  );

  const href = handleResponseUrl(
    url,
    platform || platformsValFromLocalStorage[0]['platform']
  );

  return (
    <>
      <div className="shareable-url-modal__published">
        <div className="shareable-url-modal__content-title">
          Publish and Share Kedro-Viz
        </div>
        {platformsKeysFromLocalStorage.length === 1 ? (
          <UrlBox
            url={url}
            onCopyClick={onCopyClick}
            href={href}
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
              onCopyClick={onCopyClick}
              href={href}
              showCopiedText={showCopied}
            />
          </div>
        )}
      </div>
      <div className="shareable-url-modal__published-action">
        <p className="shareable-url-modal__published-action-text">
          Republish Kedro-Viz to push new updates,
          <br />
          or publish and host Kedro-Viz with a new link.
        </p>
        <Button mode="secondary" onClick={onRepublishClick} size="small">
          Republish
        </Button>
      </div>
    </>
  );
};

export default PublishedView;
