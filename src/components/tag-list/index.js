import React from 'react';
import { connect } from 'react-redux';
import { Checkbox, Dropdown } from '@quantumblack/carbon-ui-components';
import { toggleTagActive, toggleTagFilter } from '../../actions';
import { getTags, getTagCount } from '../../selectors/tags';
import './tag-list.css';

/**
 * A Dropdown displaying a list of tags with checkboxes to toggle them on/off
 * @param {Object} tagCount Number of enabled and active tags
 * @param {Function} onToggleTagActive Handle toggling a tag's active state
 * @param {Function} onToggleTagFilter Handle toggling a tag's enabled state
 * @param {Array} tags List of tags for given pipline
 * @param {string} theme CarbonUI light/dark theme
 */
const TagList = ({
  tagCount,
  onToggleTagActive,
  onToggleTagFilter,
  tags,
  theme
}) => (
  <div className="pipeline-tags">
    <Dropdown
      theme={theme}
      width={null}
      defaultText={`Tag filters (${tagCount.enabled}/${tagCount.total})`}>
      <React.Fragment>
        {tagCount.total > 0 ? (
          <ul className="pipeline-tags__tag-list">
            {tags.map(tag => (
              <li
                key={`tag-${tag.id}`}
                title={tag.name}
                className="pipeline-tags__tag-list-item cbn-menu-option"
                onMouseEnter={onToggleTagActive(tag, true)}
                onMouseLeave={onToggleTagActive(tag, false)}>
                <Checkbox
                  checked={tag.enabled}
                  label={<span>{tag.name}</span>}
                  name={tag.id}
                  onChange={onToggleTagFilter(tag.id)}
                  theme={theme}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="pipeline-tags__empty cbn-menu-option">
            There are no tags used in this pipeline.
          </div>
        )}
      </React.Fragment>
    </Dropdown>
  </div>
);

const mapStateToProps = state => {
  const tags = getTags(state);
  const tagCount = getTagCount(state);
  return {
    tagCount,
    tags,
    theme: state.theme
  };
};

const mapDispatchToProps = dispatch => ({
  onToggleTagActive: (tag, isActive) => () => {
    dispatch(toggleTagActive(tag.id, isActive));
  },
  onToggleTagFilter: tagID => (e, { checked }) => {
    dispatch(toggleTagFilter(tagID, checked));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TagList);
