import Tooltip, { insertZeroWidthSpace } from './index';
import { setup } from '../../utils/state.mock';

const mockProps = {
  chartSize: {
    height: 766,
    left: 0,
    outerHeight: 766,
    outerWidth: 1198,
    sidebarWidth: 300,
    top: 0,
    width: 898
  },
  targetRect: {
    bottom: 341.05895,
    height: 2.1011,
    left: 856.19622,
    right: 866.03076,
    top: 338.95785,
    width: 9.83453,
    x: 856.19622,
    y: 338.95785
  },
  text: 'lorem_ipsum-dolor: sit [amet]',
  visible: true
};

describe('Tooltip', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(Tooltip);
    const container = wrapper.find('.pipeline-tooltip');
    expect(container.length).toBe(1);
  });

  it('should not add the top class when the tooltip is towards the bottom', () => {
    const targetRect = {
      ...mockProps.targetRect,
      top: mockProps.chartSize.height - 10
    };
    const wrapper = setup.shallow(Tooltip, { ...mockProps, targetRect });
    const container = wrapper.find('.pipeline-tooltip--top');
    expect(container.length).toBe(0);
  });

  it('should not add the right class when the tooltip is towards the left', () => {
    const targetRect = {
      ...mockProps.targetRect,
      left: 10
    };
    const wrapper = setup.shallow(Tooltip, { ...mockProps, targetRect });
    const container = wrapper.find('.pipeline-tooltip--right');
    expect(container.length).toBe(0);
  });

  it("should add the 'top' class when the tooltip is towards the top", () => {
    const targetRect = {
      ...mockProps.targetRect,
      top: 10
    };
    const wrapper = setup.shallow(Tooltip, { ...mockProps, targetRect });
    const container = wrapper.find('.pipeline-tooltip--top');
    expect(container.length).toBe(1);
  });

  it("should add the 'right' class when the tooltip is towards the right", () => {
    const targetRect = {
      ...mockProps.targetRect,
      left: mockProps.chartSize.width - 10
    };
    const wrapper = setup.shallow(Tooltip, { ...mockProps, targetRect });
    const container = wrapper.find('.pipeline-tooltip--right');
    expect(container.length).toBe(1);
  });
});

describe('insertZeroWidthSpace', () => {
  it('wraps special characters with zero-width spaces', () => {
    expect(insertZeroWidthSpace('-').length).toBe(3);
    expect(insertZeroWidthSpace('_').length).toBe(3);
    expect(insertZeroWidthSpace('[').length).toBe(3);
    expect(insertZeroWidthSpace(']').length).toBe(3);
    expect(insertZeroWidthSpace('/').length).toBe(3);
    expect(insertZeroWidthSpace(':').length).toBe(3);
    expect(insertZeroWidthSpace('\\').length).toBe(3);
  });

  it('does not wrap alphanumeric characters', () => {
    expect(insertZeroWidthSpace('a').length).toBe(1);
    expect(insertZeroWidthSpace('aBc123').length).toBe(6);
  });

  it('does not wrap spaces', () => {
    expect(insertZeroWidthSpace(' ').length).toBe(1);
    expect(insertZeroWidthSpace('\t').length).toBe(1);
    expect(insertZeroWidthSpace('a b').length).toBe(3);
    expect(insertZeroWidthSpace(' a ').length).toBe(3);
  });
});
