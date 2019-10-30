import React from 'react';
import { connect } from 'react-redux';
import Checkbox from '@quantumblack/kedro-ui/lib/components/checkbox';
import Dropdown from '@quantumblack/kedro-ui/lib/components/dropdown';
import '@quantumblack/kedro-ui/lib/components/menu-option/menu-option.css';
import { toggleTagActive, toggleTagFilter } from '../../actions';
import { getTagData, getTagCount } from '../../selectors/tags';
import './tag-list.css';

/**
 * A Dropdown displaying a list of tags with checkboxes to toggle them on/off
 * @param {Object} tagCount Number of enabled and active tags
 * @param {Function} onToggleTagActive Handle toggling a tag's active state
 * @param {Function} onToggleTagFilter Handle toggling a tag's enabled state
 * @param {Array} tags List of tags for given pipline
 * @param {string} theme Kedro UI light/dark theme
 */
export const TagList = ({
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
                className="pipeline-tags__tag-list-item kui-menu-option"
                onMouseEnter={() => onToggleTagActive(tag.id, true)}
                onMouseLeave={() => onToggleTagActive(tag.id, false)}>
                <Checkbox
                  checked={tag.enabled}
                  label={<span>{tag.name}</span>}
                  name={tag.id}
                  onChange={(e, { checked }) =>
                    onToggleTagFilter(tag.id, checked)
                  }
                  theme={theme}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="pipeline-tags__empty kui-menu-option">
            There are no tags used in this pipeline.
          </div>
        )}
      </React.Fragment>
    </Dropdown>
  </div>
);

export const mapStateToProps = state => {
  const tags = getTagData(state);
  const tagCount = getTagCount(state);
  return {
    tagCount,
    tags,
    theme: state.theme
  };
};

export const mapDispatchToProps = dispatch => ({
  onToggleTagActive: (tagID, active) => {
    dispatch(toggleTagActive(tagID, active));
  },
  onToggleTagFilter: (tagID, enabled) => {
    dispatch(toggleTagFilter(tagID, enabled));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TagList);
