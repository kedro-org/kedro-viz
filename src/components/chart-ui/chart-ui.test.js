import React from 'react';
import { mount, shallow } from 'enzyme';
import ChartUI, {
  ChartUI as UnconnectedChartUI,
  mapStateToProps,
  mapDispatchToProps
} from './index';
import { MockProvider, mockState } from '../../utils/data.mock';

const setup = () =>
  mount(
    <MockProvider>
      <ChartUI />
    </MockProvider>
  );

describe('ChartUI', () => {
  it('renders without crashing', () => {
    const wrapper = setup();
    const ui = wrapper.find('.pipeline-ui');
    expect(ui.length).toBe(1);
  });

  it('returns null when hasData is false', () => {
    const wrapper = shallow(<UnconnectedChartUI hasData={false} />);
    expect(wrapper.html()).toBe(null);
  });

  it('maps state to props', () => {
    const expectedResult = {
      hasData: expect.any(Boolean),
      parameters: expect.any(Boolean),
      textLabels: expect.any(Boolean),
      theme: expect.stringMatching(/light|dark/),
      view: expect.stringMatching(/combined|data|task/)
    };
    expect(mapStateToProps(mockState)).toEqual(expectedResult);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();
    mapDispatchToProps(dispatch).onChangeView(null, { value: 'data' });
    expect(dispatch.mock.calls[0][0]).toEqual({
      view: 'data',
      type: 'CHANGE_VIEW'
    });

    mapDispatchToProps(dispatch).onToggleParameters(null, { value: false });
    expect(dispatch.mock.calls[1][0]).toEqual({
      parameters: false,
      type: 'TOGGLE_PARAMETERS'
    });

    mapDispatchToProps(dispatch).onToggleTextLabels(null, { value: false });
    expect(dispatch.mock.calls[2][0]).toEqual({
      textLabels: false,
      type: 'TOGGLE_TEXT_LABELS'
    });
  });
});
