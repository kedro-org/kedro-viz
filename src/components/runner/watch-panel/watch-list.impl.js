import React from 'react';

const WatchList = ({ renderWatchListPanel }) => {
  return (
    <section className="runner-manager__editor">
      <div className="editor__header">
        <h3 className="section-title">Watch list</h3>
        <div className="editor__actions">
          {/* Parent controls the Add/Clear buttons to preserve behavior */}
        </div>
      </div>
      <div className="runner-data-panel">{renderWatchListPanel()}</div>
    </section>
  );
};

export default WatchList;
