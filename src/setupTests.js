// Configure react-testing-library
// See https://create-react-app.dev/docs/running-tests/#option-2-react-testing-library
import '@testing-library/jest-dom/extend-expect';

// Configure enzyme
// See https://create-react-app.dev/docs/running-tests/#srcsetuptestsjs
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

//Required for plotly tests
window.URL.createObjectURL = function () {};

configure({ adapter: new Adapter() });
