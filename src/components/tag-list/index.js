import React from 'react';
import { connect } from 'react-redux';
import { Checkbox, Dropdown } from '@quantumblack/carbon-ui-components';
import { toggleTagActive, toggleTagDisabled } from '../../actions';
import { getTags, getTagLabel } from '../../selectors/tags';
import './tag-list.css';

const TagList = ({
  onToggleTagActive,
  onToggleTagDisabled,
  tags,
  tagLabel,
  theme
}) => (
  <div className="pipeline-tags">
    <Dropdown
      theme={theme}
      width={null}
      defaultText={tagLabel}>
      <React.Fragment>
        <ul className="pipeline-tags__tag-list">
          { tags.map(tag => (
            <li
              key={`tag-${tag.id}`}
              className="pipeline-tags__tag-list-item cbn-menu-option"
              onMouseEnter={onToggleTagActive(tag, true)}
              onMouseLeave={onToggleTagActive(tag, false)}>
              <Checkbox
                checked={!tag.disabled}
                label={<span>{tag.name}</span>}
                name={tag.id}
                onChange={onToggleTagDisabled(tag.id)}
                theme={theme} />
            </li>
          )) }
        </ul>
      </React.Fragment>
    </Dropdown>
  </div>
);

const mapStateToProps = (state) => ({
  tags: getTags(state),
  tagLabel: getTagLabel(state),
  theme: state.theme
});

const mapDispatchToProps = (dispatch) => ({
  onToggleTagActive: (tag, isActive) => () => {
    dispatch(toggleTagActive(tag.id, isActive));
  },
  onToggleTagDisabled: tagID => (e, { checked }) => {
    dispatch(toggleTagDisabled(tagID, !checked));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(TagList);
