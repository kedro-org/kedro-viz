import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { getVisibleMetaSidebar } from '../../selectors/metadata';
import { loadLocalStorage, saveLocalStorage } from '../../store/helpers';
import { localStorageName, metaSidebarWidth } from '../../config';
import { toggleShowFeatureHints } from '../../actions';

import Button from '../ui/button';
import CloseIcon from '../icons/close';
import DelayedRenderer from '../ui/delayed-renderer';
import FeatureHintDot from './feature-hint-dot';
import { featureHintsContent } from './feature-hints-content';

import './feature-hints.css';

const localStorageKeyShowHints = 'showFeatureHints';
export const localStorageKeyFeatureHintsStep = 'featureHintStep';
const numFeatureHints = featureHintsContent.length;

const FeatureHints = ({ metadataVisible, onToggleShowFeatureHints }) => {
  const [areFeatureHintsShown, setAreFeatureHintsShown] = useState(false);
  const [featureHintStep, setFeatureHintStep] = useState(0);
  const [hideHighlightDot, setHideHighlightDot] = useState(false);
  const [requestedHintClose, setRequestedHintClose] = useState(false);

  useEffect(() => {
    const localStorageState = loadLocalStorage(localStorageName);

    if (localStorageState[localStorageKeyShowHints]) {
      setAreFeatureHintsShown(true);
    } else {
      setAreFeatureHintsShown(false);
    }

    if (localStorageState.featureHintStep) {
      setFeatureHintStep(localStorageState.featureHintStep);
    }
  }, []);

  useEffect(() => {
    if (!featureHintsContent[featureHintStep].elementId) {
      setHideHighlightDot(true);
    }

    saveLocalStorage(localStorageName, {
      [localStorageKeyFeatureHintsStep]: featureHintStep,
    });
  }, [featureHintStep]);

  const triggerCloseHints = () => {
    setRequestedHintClose(true);
    setHideHighlightDot(true);
    onToggleShowFeatureHints(false);

    setTimeout(() => {
      triggerLocalStorageSave();
    }, 4000);
  };

  const triggerLocalStorageSave = () => {
    setAreFeatureHintsShown(false);
    saveLocalStorage(localStorageName, {
      [localStorageKeyFeatureHintsStep]: 0,
      [localStorageKeyShowHints]: false,
    });
  };

  if (areFeatureHintsShown === false) {
    return null;
  }

  return (
    <DelayedRenderer>
      <FeatureHintDot
        featureHintStep={featureHintStep}
        hideDot={hideHighlightDot}
        requestedHintClose={requestedHintClose}
      />
      <div
        className="feature-hints"
        style={{
          right: metadataVisible ? `${metaSidebarWidth.open + 36}px` : '36px',
        }}
      >
        {requestedHintClose ? (
          <p className="feature-hints__reopen-message">
            You can revisit these hints at any time in the Settings panel.
          </p>
        ) : (
          <>
            <div className="feature-hints__nav">
              {featureHintStep + 1} of {numFeatureHints}
              <div
                className="feature-hints__close"
                onClick={() => triggerCloseHints()}
              >
                <CloseIcon />
              </div>
            </div>
            <div className="feature-hints__header">
              {featureHintsContent[featureHintStep].title}
            </div>
            {featureHintsContent[featureHintStep].image && (
              <img
                alt={featureHintsContent[featureHintStep].title}
                src={featureHintsContent[featureHintStep].image}
              />
            )}
            <div className="feature-hints__description">
              {featureHintsContent[featureHintStep].description}
            </div>
            <div className="feature-hints__buttonsWrapper">
              <div>
                {featureHintsContent[featureHintStep].learnMoreLink ? (
                  <a
                    href={featureHintsContent[featureHintStep].learnMoreLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Button mode="secondary" size="small">
                      Learn more
                    </Button>
                  </a>
                ) : null}
              </div>
              <div className="feature-hints__backNextButtons">
                {featureHintStep > 0 ? (
                  <Button
                    mode="secondary"
                    onClick={() => setFeatureHintStep(featureHintStep - 1)}
                    size="small"
                  >
                    Back
                  </Button>
                ) : null}
                <Button
                  mode="primary"
                  onClick={() =>
                    featureHintStep + 1 === numFeatureHints
                      ? triggerCloseHints()
                      : setFeatureHintStep(featureHintStep + 1)
                  }
                  size="small"
                >
                  {featureHintStep + 1 === numFeatureHints ? 'Close' : 'Next'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </DelayedRenderer>
  );
};

export const mapDispatchToProps = (dispatch, ownProps) => ({
  onToggleShowFeatureHints: () => {
    dispatch(toggleShowFeatureHints(false));
  },
  ...ownProps,
});

export const mapStateToProps = (state) => {
  return {
    metadataVisible: getVisibleMetaSidebar(state),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(FeatureHints);
