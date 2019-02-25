import React from 'react';
import { connect } from 'react-redux';
import { Checkbox, Dropdown } from '@quantumblack/carbon-ui-components';
import { toggleTagActive, toggleTagFilter } from '../../actions';
import { getTags, getTagCount } from '../../selectors/tags';
import './tag-list.css';

const TagList = ({
  tagCount,
  onToggleTagActive,
  onToggleTagFilter,
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
                checked={tag.enabled}
                label={<span>{tag.name}</span>}
                name={tag.id}
                onChange={onToggleTagFilter(tag.id)}
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
  const { enabled, total } = tagCount;
  const tagLabelText = enabled === 0 ? 'all' : `${enabled}/${total}`;
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
  onToggleTagFilter: tagID => (e, { checked }) => {
    dispatch(toggleTagFilter(tagID, checked));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(TagList);
