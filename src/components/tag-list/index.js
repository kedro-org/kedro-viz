import React from 'react';
import { connect } from 'react-redux';
import { Checkbox, Dropdown } from '@quantumblack/carbon-ui-components';
import { toggleTagActive, toggleTagDisabled, toggleTagsDisabled } from '../../actions';
import { getTags, getTagCount } from '../../selectors/tags';
import './tag-list.css';

const TagList = ({
  tagCount,
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
                checked={tagCount.visible === tagCount.total ? false : !tag.disabled}
                label={<span>{tag.name}</span>}
                name={tag.id}
                onChange={onToggleTagDisabled(tag.id, tags, tagCount)}
                theme={theme} />
            </li>
          )) }
        </ul>
      </React.Fragment>
    </Dropdown>
  </div>
);

const mapStateToProps = (state) => {
  const tags = getTags(state);
  const tagCount = getTagCount(state);
  const { total, visible } = tagCount;
  const tagLabelText = visible < total ? `${visible}/${total}` : 'all';
  const tagLabel = `Tags (${tagLabelText})`;
  return {
    tagCount,
    tags,
    tagLabel,
    theme: state.theme,
  };
};

const mapDispatchToProps = (dispatch) => ({
  onToggleTagActive: (tag, isActive) => () => {
    dispatch(toggleTagActive(tag.id, isActive));
  },
  onToggleTagDisabled: (tagID, tags, { total, visible }) => (e, { checked }) => {
    const tagIDs = tags.map(d => d.id);
    if (visible === total) {
      dispatch(toggleTagsDisabled(tagIDs.filter(id => id !== tagID), true));
    } else if (visible === 0 || (visible === 1 && tags.find(d => !d.disabled).id === tagID)) {
      dispatch(toggleTagsDisabled(tagIDs, false));
    } else {
      dispatch(toggleTagDisabled(tagID, !checked));
    }
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(TagList);
