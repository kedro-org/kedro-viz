import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { getVisibleMetaSidebar } from '../../selectors/metadata';
import { loadLocalStorage, saveLocalStorage } from '../../store/helpers';
import { localStorageName, metaSidebarWidth } from '../../config';

import Button from '../ui/button';
import CloseIcon from '../icons/close';
import { featureHintsContent } from './feature-hints-content';

import './feature-hints.css';

const localStorageKey = 'showFeatureHints';
const numFeatureHints = featureHintsContent.length;

const FeatureHints = ({ metadataVisible }) => {
  const [areFeatureHintsShown, setAreFeatureHintsShown] = useState(false);
  const [featureHintStep, setFeatureHintStep] = useState(0);
  const [elementCenter, setElementCenter] = useState({ x: 0, y: 0 });
  const [hideHighlightDot, setHideHighlightDot] = useState(false);
  const [requestedHintClose, setRequestedHintClose] = useState(false);

  useEffect(() => {
    const localStorageState = loadLocalStorage(localStorageName);

    if (localStorageState[localStorageKey]) {
      setAreFeatureHintsShown(true);
    } else {
      setAreFeatureHintsShown(false);
    }
  }, []);

  useEffect(() => {
    const findAndSetCoords = (elementId) => {
      if (!elementId) {
        return;
      }

      const $element = document.querySelector(elementId);

      if ($element) {
        const { left, top, width, height } = $element.getBoundingClientRect();

        setHideHighlightDot(false);
        setElementCenter({
          x: left + width / 2,
          y: top + height / 2,
        });
      } else {
        setHideHighlightDot(true);
      }
    };

    if (!featureHintsContent[featureHintStep].elementId) {
      setHideHighlightDot(true);
    }

    findAndSetCoords(featureHintsContent[featureHintStep].elementId);
  }, [featureHintStep]);

  const triggerCloseHints = () => {
    setRequestedHintClose(true);
    setHideHighlightDot(true);

    setTimeout(() => {
      triggerLocalStorageSave();
    }, 4000);
  };

  const triggerLocalStorageSave = () => {
    setAreFeatureHintsShown(false);
    saveLocalStorage(localStorageName, {
      [localStorageKey]: false,
    });
  };

  if (areFeatureHintsShown === false) {
    return null;
  }

  return (
    <>
      <div
        className="feature-hints"
        style={{
          right: metadataVisible ? `${metaSidebarWidth.open + 36}px` : '36px',
        }}
      >
        {requestedHintClose ? (
          <p className="feature-hints__reopen-message">
            You can revisit these hints at any time in the ‘Settings’ panel.
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
              <div className="feature-hints__backNextBtns">
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
      <div
        className="feature-hints__highlightDot"
        style={{
          left: `${elementCenter.x}px`,
          opacity: hideHighlightDot ? 0 : 1,
          top: `${elementCenter.y}px`,
        }}
      >
        <svg fill="none" height="100" viewBox="0 0 100 100" width="100">
          <circle
            cx="50"
            cy="50"
            fillOpacity="0.1"
            fill="url(#paint0_radial_103_11727)"
            r="49.5"
            stroke="#FFBC00"
            strokeWidth={1.5}
          />
          <defs>
            <radialGradient
              cx="0"
              cy="0"
              gradientTransform="translate(50 50) rotate(90) scale(50)"
              gradientUnits="userSpaceOnUse"
              id="paint0_radial_103_11727"
              r="1"
            >
              <stop offset="0.140625" stopColor="#FFE300" stopOpacity="0" />
              <stop offset="1" stopColor="#FFE300" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </>
  );
};

export const mapStateToProps = (state) => ({
  metadataVisible: getVisibleMetaSidebar(state),
  sidebarVisible: state.visible.sidebar,
});

export default connect(mapStateToProps)(FeatureHints);
