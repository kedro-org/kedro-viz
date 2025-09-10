import React from 'react';
import { render, screen } from '@testing-library/react';
import ControlPanel from '../control-panel';
import toYamlString from '../utils/yamlUtils';

describe('ControlPanel', () => {
  const baseProps = {
    currentCommand: 'kedro run',
    onStartRun: jest.fn(),
    commandInputRef: { current: null },
    onCopyCommand: jest.fn(),
    hasParamChanges: true,
    activePipeline: 'default',
    selectedTags: ['tag1'],
    onOpenParamsDialog: jest.fn(),
    isParamsModalOpen: false,
    onCloseParamsModal: jest.fn(),
    paramItems: [],
    paramsDialogSelectedKey: null,
    onSelectParamKey: jest.fn(),
    paramOriginals: {},
    getParamValue: jest.fn(),
    getEditedParamValue: jest.fn(),
    normalizeParamPrefix: (value) => value,
    collectParamDiffs: () => [],
    renderHighlightedYamlLines: (text) => text,
    quoteIfNeeded: (str) => str,
    paramsArgString: '',
  };

  it('renders run command header and buttons', () => {
    render(<ControlPanel {...baseProps} />);
    expect(screen.getByText('Run command')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start run' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Copy full command')).toBeInTheDocument();
  });

  it('shows Parameters link when hasParamChanges is true', () => {
    render(<ControlPanel {...baseProps} />);
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('View changes')).toBeInTheDocument();
  });
});
