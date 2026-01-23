import React from 'react';
import { connect } from 'react-redux';
import SyntaxHighlighter from '../ui/syntax-highlighter';
import modifiers from '../../utils/modifiers';
import './styles/metadata-code.scss';

/**
 * A highlighted code panel
 */
export const MetaDataCode = ({
  sidebarVisible,
  visible = true,
  value = '',
  title = '',
}) => {
  return (
    <div
      className={modifiers(
        'pipeline-metadata-code',
        { visible, sidebarVisible },
        'kedro'
      )}
    >
      {title && <h2 className="pipeline-metadata-code__title">{title}</h2>}
      <div className="pipeline-metadata-code__code">
        <SyntaxHighlighter code={value} />
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  sidebarVisible: state.visible.sidebar,
});

export default connect(mapStateToProps)(MetaDataCode);
