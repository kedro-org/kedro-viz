import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { flatten, find, flow, isEqual, map } from 'lodash/fp';
import 'what-input';
import './dropdown.css';
import DropdownRenderer from './dropdown-renderer';
import EventController from './event-controller.js';

const Dropdown = ({
  children,
  defaultText,
  disabled,
  onChanged,
  onClosed,
  onOpened,
  width,
})=>{

    const [focusedOption, setFocusedOption] = useState(null);
    const [selectedOption, setSelectedOption] = useState(findSelectedOption());
    const [open, setOpen] = useState(false);

    useEffect(() => {
      setSelectedOption(findSelectedOption())
    }, [selectedOption]);

    useEffect(()=>{
      return()=>
      EventController.removeBodyListeners();
    });
  const dropdownRef= useRef(null)

  /**
   * Handler for closing a dropdown if a click occured outside the dropdown.
   * @param {object} e - event object
   */
  const _handleBodyClicked = (e) => {
    if (!dropdownRef.current.contains(e.target) && open) {
      setOpen(false)
    }
  }

  /**
   * Check whether new props contain updated children
   * @param {Object} nextProps - New component props
   * @return {Boolean} True if new children are different from current ones
   */
  const _childrenHaveChanged = (nextProps) => {
    const children = [this.props, nextProps].map((props) =>
      React.Children.toArray(props.children)
    );

    return !isEqual(...children);
  }

  /**
   * Format the selected option props for adding to state
   * @param {Object} props - Component props
   * @return {Object} Selected option object for use in the state
   */
  const _findSelectedOption = (props) => {
    const selectedOptionElement = this._findSelectedOptionElement(props);

    // check children for a selected option
    if (selectedOptionElement) {
      const { id, primaryText, value } = selectedOptionElement.props;

      return {
        id,
        label: primaryText,
        value,
      };
    }

    // otherwise, default to first
    return {
      id: null,
      label: null,
      value: null,
    };
  }

  /**
   * Find the selected option by traversing sections and MenuOptions
   * @param {Object} props - Component props (optional)
   * @return {Object} Selected option element
   */
  const _findSelectedOptionElement = (props = this.props) => {
    const children = React.Children.toArray(props.children);

    if (!children.length) {
      return null;
    }

    // we may have an array of options
    // or an array of sections, containing options
    if (children[0].type === 'section') {
      return flow(
        map((x) => x.props.children),
        flatten,
        find((x) => x.props.selected)
      )(children);
    }

    return find((child) => child.props.selected)(children);
  }

  /**
   * Event handler which is fired when the label is clicked
   */
  const _handleLabelClicked = () => {
    const { open } = this.state;
    const { onOpened, onClosed } = this.props;

    let callback = null;

    // set callbacks, if defined
    if (typeof onOpened === 'function' && !open) {
      callback = onOpened;
    } else if (typeof onClosed === 'function' && open) {
      callback = onClosed;
    }

    // remove or add the event listeners for
    if (open) {
      EventController.removeBodyListeners();
    } else {
      EventController.addBodyListener(this._handleBodyClicked);
    }

    this.setState({ open: !open }, callback);
    this._focusLabel();
  }

  /**
   * Sort, filter and flatten the list of children to retrieve just the MenuOptions,
   * with any Sections removed.
   * @return {Object} A flat list of MenuOptions
   */
  const _getOptionsList = () => {
    /**
     * Recurse through sections to retrieve a list of all MenuOptions
     * @param  {Object} previous The Options array as of the previous iteration
     * @param  {Object} current  The current item (either a MenuOption or Section)
     * @return {Object}          The current state of the Options array
     */
    const getSectionChildren = (previous, current) => {
      if (current.props.primaryText) {
        // MenuOption: Add to list
        return previous.concat(current);
      }
      if (current.type === 'section') {
        // Section: Keep recursing
        return previous.concat(
          current.props.children.reduce(getSectionChildren, [])
        );
      }
      return previous;
    };

    return React.Children.toArray(this.props.children).reduce(
      getSectionChildren,
      []
    );
  }

  /**
   * Convenience method to return focus from an option to the label.
   * This is particularly useful for screen-readers and keyboard users.
   */
  const _focusLabel = () => {
    this.dropdown.querySelector('.dropdown__label').focus();

    this.setState({
      focusedOption: null,
    });
  }

  /**
   * When the focused option changes (e.g. via up/down keyboard controls),
   * update the focusedOption index state and select the new one
   * @param {number} direction - The direction that focus is travelling through the list:
   * negative is up and positive is down.
   */
  const _handleFocusChange = (direction) => {
    let { focusedOption } = this.state;
    const optionsLength = this._getOptionsList().length;

    if (focusedOption === null) {
      focusedOption = direction > 0 ? 0 : optionsLength - 1;
    } else {
      focusedOption += direction;
    }
    if (focusedOption >= optionsLength || focusedOption < 0) {
      focusedOption = null;
    }

    this.setState({ focusedOption }, () => {
      // Focus either the button label or the active option.
      // This is so screen-readers will follow the active element
      const focusClass =
        focusedOption !== null ? '.menu-option--focused' : '.dropdown__label';

      this.dropdown.querySelector(focusClass).focus();
    });
  }

  /**
   * Event handler which is fired when a child item is selected
   */
  const _handleOptionSelected = (obj) => {
    const { label, id, value } = obj;
    const { onChanged, onClosed } = this.props;

    // detect if the selected item has changed
    const hasChanged = value !== this.state.selectedOption.value;
    if (hasChanged) {
      const selectedOption = { label, value, id };
      this.setState({ open: false, selectedOption }, () => {
        if (typeof onChanged === 'function') {
          onChanged(obj);
        }

        if (typeof onClosed === 'function') {
          onClosed();
        }
      });
    } else {
      this.setState({ open: false }, () => {
        if (typeof onClosed === 'function') {
          onClosed();
        }
      });
    }
    this._focusLabel();
  }

  /**
   * Retrieve a reference to the dropdown DOM node (from the renderer component),
   * and assign it to a class-wide variable property.
   * @param {object} el - The ref for the Dropdown container node
   */
  const _handleRef = (el) => {
    this.dropdown = el;
  }

  /**
   * API method to open the dropdown
   */
  const _handleOpen = () => {
  
    setOpen(true)
    this.setState({ open: true }, () => {
      this._focusLabel();
      if (typeof onOpened === 'function') {
        onOpened();
      }
    });

    // add event listener to automatically close the dropdown
    EventController.addBodyListener(this._handleBodyClicked);
  }

  /**
   * API method to close the dropdown
   */
  const _handleClose = () => {

    this.setState({ open: false }, () => {
      if (typeof onClosed === 'function') {
        onClosed();
      }
    });

    // remove event listener
    EventController.removeBodyListeners();
  }



    return (
      <DropdownRenderer
        defaultText={defaultText}
        disabled={disabled}
        handleRef={this._handleRef}
        onLabelClicked={this._handleLabelClicked}
        onOptionSelected={this._handleOptionSelected}
        onSelectChanged={this._handleFocusChange}
        open={open}
        focusedOption={focusedOption}
        selectedOption={selectedOption}
        width={width}
        ref={dropdownRef}
      >
        {children}
      </DropdownRenderer>
    );

}

Dropdown.defaultProps = {
  children: null,
  defaultText: 'Please select...',
  disabled: false,
  onChanged: null,
  onClosed: null,
  onOpened: null,
  width: 160,
};

Dropdown.propTypes = {
  /**
   * Child items. The nodes which React will pass down, defined inside the DropdownRenderer tag
   */
  children: PropTypes.node.isRequired,
  /**
   * Default text to show in a closed unselected state
   */
  defaultText: PropTypes.string,
  /**
   * Whether to disable the dropdown
   */
  disabled: PropTypes.bool,
  /**
   * Callback function to be executed when a menu item is clicked, other than the one currently selected.
   */
  onChanged: PropTypes.func,
  /**
   * Callback to be executed after menu opens
   */
  onOpened: PropTypes.func,
  /**
   * Callback to be executed after menu closed
   */
  onClosed: PropTypes.func,
  /**
   * The width for the component. Both the label and options are the same width
   */
  width: PropTypes.number,
};

export default Dropdown;
