import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { featureHintsContent } from './feature-hints-content';

import './feature-hints.scss';

const FeatureHintDot = ({
  appState,
  featureHintStep,
  hideDot,
  requestedHintClose,
}) => {
  const [elementCenter, setElementCenter] = useState({ x: null, y: null });
  const [hideHighlightDot, setHideHighlightDot] = useState(hideDot);

  useEffect(() => {
    setHideHighlightDot(hideDot);
  }, [hideDot]);

  useEffect(() => {
    const findAndSetCoords = (elementId) => {
      if (!elementId || requestedHintClose) {
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

    // Use `appState` to track when the graph layout is changing, updating the
    // position of the feature hint accordingly.
  }, [appState, featureHintStep, requestedHintClose]);

  return (
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
  );
};

export const mapStateToProps = (state) => ({
  appState: state,
});

export default connect(mapStateToProps)(FeatureHintDot);
