import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { loadLocalStorage, saveLocalStorage } from '../../store/helpers';
import { localStorageName } from '../../config';

import Button from '../ui/button';
import CloseIcon from '../icons/close';
import { onboardingContent } from './app-onboarding-content';

import './app-onboarding.css';

const localStorageKey = 'hideAppOnboarding';

const AppOnboarding = () => {
  const [isOnboardingHidden, setIsOnboardingHidden] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [elementCenter, setElementCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const localStorageState = loadLocalStorage(localStorageName);

    if (localStorageState[localStorageKey]) {
      setIsOnboardingHidden(true);
    }
  }, []);

  useEffect(() => {
    const findAndSetCoords = (elementId) => {
      const $element = document.getElementById(elementId);

      if ($element) {
        const { left, top, width, height } = $element.getBoundingClientRect();

        setElementCenter({
          x: left + width / 2,
          y: top + height / 2,
        });
      }
    };

    findAndSetCoords(onboardingContent[onboardingStep].elementId);
  }, [onboardingStep]);

  const triggerLocalStorageSave = () => {
    setIsOnboardingHidden(true);
    saveLocalStorage(localStorageName, {
      [localStorageKey]: true,
    });
  };

  if (isOnboardingHidden) {
    return null;
  }

  return (
    <>
      <div className="app-onboarding">
        <div
          className="app-onboarding__close"
          onClick={() => setIsOnboardingHidden(true)}
        >
          <CloseIcon />
        </div>
        <div className="app-onboarding__header">
          {onboardingContent[onboardingStep].title}
        </div>
        <div className="app-onboarding__description">
          {onboardingContent[onboardingStep].description}
        </div>
        <div className="app-onboarding__buttonsWrapper">
          <a
            href={onboardingContent[onboardingStep].learnMoreLink}
            rel="noreferrer"
            target="_blank"
          >
            <Button mode="primary" size="small">
              Learn more
            </Button>
          </a>
          <Button
            mode="secondary"
            onClick={triggerLocalStorageSave}
            size="small"
          >
            Don’t show me again
          </Button>
        </div>
        <div className="app-onboarding__stepIndicators">
          {onboardingContent.map((feature, index) => {
            return (
              <div
                className={classnames('app-onboarding__indicatorDot', {
                  'app-onboarding__indicatorDot--active':
                    index === onboardingStep,
                })}
                key={feature.title}
                onClick={() => setOnboardingStep(index)}
              ></div>
            );
          })}
        </div>
      </div>
      <div
        className="app-onboarding__highlightDot"
        style={{
          left: `${elementCenter.x}px`,
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

export default AppOnboarding;
