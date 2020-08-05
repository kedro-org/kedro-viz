import React from 'react';
import { connect } from 'react-redux';
import { toggleMiniMap, updateZoom } from '../../actions';
import { getChartZoom } from '../../selectors/layout';
import IconButton from '../icon-button';
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
  const { scale, minScale, maxScale } = chartZoom;

  return (
    <>
      <ul className="pipeline-minimap-toolbar kedro">
        <IconButton
          icon="map"
          className={
            'pipeline-minimap-button pipeline-icon--stroke pipeline-minimap-button--map'
          }
          ariaLabel={`Turn minimap ${visible.miniMap ? 'off' : 'on'}`}
          onClick={() => onToggleMiniMap(!visible.miniMap)}
          labelText={`${visible.miniMap ? 'Hide' : 'Show'} minimap`}
          visible={visible.miniMapBtn}
          active={visible.miniMap}
        />
        <IconButton
          icon="plus"
          className={
            'pipeline-minimap-button pipeline-icon--stroke pipeline-minimap-button--zoom-in'
          }
          ariaLabel={'Zoom in'}
          labelText={'Zoom in'}
          visible={visible.miniMapBtn}
          disabled={scale >= maxScale}
          onClick={() => onUpdateChartZoom(scaleZoom(chartZoom, 1.3))}
        />
        <IconButton
          icon="minus"
          className={
            'pipeline-minimap-button pipeline-icon--stroke pipeline-minimap-button--zoom-out'
          }
          ariaLabel={'Zoom out'}
          labelText={'Zoom out'}
          visible={visible.miniMapBtn}
          disabled={scale <= minScale}
          onClick={() => onUpdateChartZoom(scaleZoom(chartZoom, 0.7))}
        />
        <IconButton
          icon="reset"
          className={'pipeline-minimap-button pipeline-minimap-button--reset'}
          ariaLabel={'Reset zoom'}
          labelText={'Reset zoom'}
          visible={visible.miniMapBtn}
          onClick={() => onUpdateChartZoom(scaleZoom(chartZoom, 0))}
        />
        <li>
          <span className="pipeline-minimap-toolbar__scale" title="Zoom level">
            {Math.round(100 * chartZoom.scale) || 100}%
          </span>
        </li>
      </ul>
    </>
  );
};

const scaleZoom = ({ scale }, factor) => ({
  scale: scale * (factor || 1),
  applied: false,
  transition: true,
  reset: factor === 0
});

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
