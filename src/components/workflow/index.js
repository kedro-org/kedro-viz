import Workflow from './workflow';
import { withHooksHOC } from '../../utils/hooks/with-hooks-hoc';

/**
 * This is to wrap the Class component Workflow in a hook
 * hence we can pass in other custom hooks
 */
export default withHooksHOC(Workflow);
