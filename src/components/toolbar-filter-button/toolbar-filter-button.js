import React from 'react';
import { connect } from 'react-redux';
import IconButton from '../ui/icon-button';
import FilterIcon from '../icons/filter';
import { togglePipelineFilter } from '../../actions';

import './toolbar-filter-button.scss';

/**
 * Filter button component used in the sidebar toolbar
 * @param {Boolean} displayFilterBtn Whether the filter button should be displayed
 * @param {Function} onTogglePipelineFilter Handler for filter button click
 */
export const ToolbarFilterButton = ({
  displayFilterBtn,
  onTogglePipelineFilter,
}) => {
  return (
    <div className="pipeline-toolbar--filter-container">
      <IconButton
        ariaLabel={`Open pipeline filter`}
        className={'pipeline-menu-button--labels'}
        dataTest={`sidebar-flowchart-filter-btn-${displayFilterBtn}`}
        icon={FilterIcon}
        labelText={`Open pipeline filter`}
        onClick={() => onTogglePipelineFilter()}
        visible={displayFilterBtn}
        container={'div'}
      />
      <hr className={'pipeline-toolbar--divider'} />
    </div>
  );
};

const mapStateToProps = (state) => ({
  displayFilterBtn: state.display.filterBtn,
});

export const mapDispatchToProps = (dispatch) => ({
  onTogglePipelineFilter: () => {
    dispatch(togglePipelineFilter());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolbarFilterButton);
