import React from 'react';
import { render, screen } from '@testing-library/react';
import ControlPanel from '../control-panel';

describe('ControlPanel', () => {
  const baseProps = {
    commandBuilder: {
      commandString: 'kedro run',
      hasParamChanges: true,
      activePipeline: 'default',
      selectedTags: ['tag1'],
      kedroEnv: 'local',
      diffModel: [],
      paramsArgString: '',
    },
    onStartRun: jest.fn(),
    onOpenParamsDialog: jest.fn(),
    isParamsModalOpen: false,
    onCloseParamsModal: jest.fn(),
    paramsDialogSelectedKey: null,
    onSelectParamKey: jest.fn(),
    renderHighlightedYamlLines: (text) => text,
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
