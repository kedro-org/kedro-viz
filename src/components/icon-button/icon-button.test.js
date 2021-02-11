import IconButton from '.';
import { setup } from '../../utils/state.mock';
import MenuIcon from '../icons/menu';

describe('IconButton', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(IconButton, {
      ariaLive: 'polite',
      ariaLabel: `Change theme`,
      onClick: () => {},
      icon: MenuIcon,
      labelText: 'Toggle theme',
      visible: true,
    });
    expect(wrapper.find('li').length).toBe(1);
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(1);
  });

  it('calls a function on click', () => {
    const onClick = jest.fn();
    const wrapper = setup.shallow(IconButton, { onClick });
    expect(onClick.mock.calls.length).toBe(0);
    wrapper.find('button').simulate('click');
    expect(onClick.mock.calls.length).toBe(1);
  });

  it('hides when visibility is false', () => {
    const wrapper = setup.shallow(IconButton, { visible: false });
    expect(wrapper.find('li').length).toBe(0);
    expect(wrapper.find('.pipeline-icon-toolbar__button').length).toBe(0);
  });
});
