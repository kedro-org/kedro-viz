import React from 'react';
import { connect } from 'react-redux';
import { toggleMiniMap, updateZoom } from '../../actions';
import { getChartZoom } from '../../selectors/layout';
import IconButton from '../icon-toolbar/icon-button';
import './minimap-toolbar.css';

/**
 * Controls for minimap
 */
export const MiniMapToolbar = ({
  onToggleMiniMap,
  visible,
  chartZoom,
  onUpdateChartZoom
}) => {
  return (
    <>
      <ul className="pipeline-minimap-toolbar kedro">
        <IconButton
          icon="map"
          className={'pipeline-minimap-button pipeline-minimap-button--map'}
          ariaLabel={`Turn minimap ${visible.miniMap ? 'off' : 'on'}`}
          onClick={() => onToggleMiniMap(!visible.miniMap)}
          labelText={`${visible.miniMap ? 'Hide' : 'Show'} minimap`}
          visible={visible.miniMapBtn}
          active={visible.miniMap}
        />
        <IconButton
          icon="plus"
          className={'pipeline-minimap-button pipeline-minimap-button--zoom-in'}
          ariaLabel={'Zoom in'}
          labelText={'Zoom in'}
          visible={visible.miniMapBtn}
          disabled={chartZoom.scale >= 2}
          onClick={() => onUpdateChartZoom(scaleZoom(chartZoom, 1.3))}
        />
        <IconButton
          icon="minus"
          className={
            'pipeline-minimap-button pipeline-minimap-button--zoom-out'
          }
          ariaLabel={'Zoom out'}
          labelText={'Zoom out'}
          visible={visible.miniMapBtn}
          onClick={() => onUpdateChartZoom(scaleZoom(chartZoom, 0.7))}
        />
        <IconButton
          icon="reset"
          className={'pipeline-minimap-button pipeline-minimap-button--reset'}
          ariaLabel={'Zoom reset'}
          labelText={'Zoom reset'}
          visible={visible.miniMapBtn}
          onClick={() => onUpdateChartZoom(scaleZoom(chartZoom, 0))}
        />
        <li>
          <span className="pipeline-minimap-toolbar__scale" title="Zoom level">
            {Math.round(100 * chartZoom.scale)}%
          </span>
        </li>
      </ul>
    </>
  );
};

const scaleZoom = ({ scale, x, y }, factor) => {
  const rescale = scale * (factor || 1);

  return {
    applied: false,
    transition: true,
    reset: factor === 0,
    scale: rescale,
    x,
    y
  };
};

export const mapStateToProps = state => ({
  visible: state.visible,
  chartZoom: getChartZoom(state)
});

export const mapDispatchToProps = dispatch => ({
  onToggleMiniMap: value => {
    dispatch(toggleMiniMap(value));
  },
  onUpdateChartZoom: transform => {
    dispatch(updateZoom(transform));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MiniMapToolbar);
