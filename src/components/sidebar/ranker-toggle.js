import React from 'react';
import { connect } from 'react-redux';
import RadioButton from '@quantumblack/kedro-ui/lib/components/radio-button';
import { changeRanker } from '../../actions';

const RankerToggle = ({ ranker, onChangeRanker, theme }) => (
  <div style={{ padding: '12px 24px' }}>
    {['none', 'network-simplex', 'tight-tree', 'longest-path'].map(r => (
      <RadioButton
        key={r}
        checked={ranker === r}
        label={`Ranker: ${r}`}
        name="ranker"
        onChange={() => onChangeRanker(r)}
        value={r}
        theme={theme}
      />
    ))}
  </div>
);

const mapStateToProps = state => ({
  ranker: state.ranker,
  theme: state.theme
});

const mapDispatchToProps = dispatch => ({
  onChangeRanker: ranker => {
    dispatch(changeRanker(ranker));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RankerToggle);
