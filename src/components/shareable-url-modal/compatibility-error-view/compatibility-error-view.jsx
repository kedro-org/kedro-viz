import React from 'react';
import Button from '../../ui/button';

const CompatibilityErrorView = ({ onClick }) => (
  <div className="shareable-url-modal__button-wrapper shareable-url-modal__button-wrapper--right">
    <Button mode="secondary" onClick={onClick} size="small">
      Cancel
    </Button>
    <a
      href="https://docs.kedro.org/en/latest/visualisation/share_kedro_viz.html"
      rel="noreferrer"
      target="_blank"
    >
      <Button size="small">View documentation</Button>
    </a>
  </div>
);

export default CompatibilityErrorView;
