import React from 'react';
import KonamiCode from 'konami-code';
import './easter-egg.css';
import mp3 from './brodyquest.mp3';
import img from './easter-egg.png';

/**
 * Konami code Easter Egg component
 */
class EasterEgg extends React.Component {
  /**
   * Create new APP
   * @param {object} props
   */
  constructor(props) {
    super(props);
    this.state = {
      play: false,
    };
    if (typeof jest === 'undefined') {
      console.info('Konami code is supported');
    }

    this.audio = new Audio(mp3);
    this.audio.loop = true;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Called when mounted to view
   */
  componentDidMount() {
    const konami = new KonamiCode();
    konami.listen(this.toggleState.bind(this));
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Triggered when component state updates
   */
  componentDidUpdate() {
    this.toggleAudio();
    this.toggleCSS();
  }

  /**
   * Called just before component is removed from the view
   */
  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.body.classList.remove('easter-theme');
  }

  /**
   * Handle keyboard interaction
   * @param {Event} e
   */
  handleKeyDown(e) {
    const escape = e.keyCode === 27;
    if (escape && this.state.play) {
      this.setState({
        play: false,
      });
    }
  }

  /**
   * Toggle play state on/off
   */
  toggleState() {
    this.setState({ play: !this.state.play });
  }

  /**
   * Play/Pause the mp3
   */
  toggleAudio() {
    if (this.state.play) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  /**
   * Play/Pause the mp3
   */
  toggleCSS() {
    if (this.state.play) {
      document.body.classList.add('easter-theme');
    } else {
      document.body.classList.remove('easter-theme');
    }
  }

  /**
   * Render the component
   * @return {ReactElement}
   */
  render() {
    const { play } = this.state;
    if (!play) {
      return null;
    }
    return (
      <div className="easter-egg">
        <img src={img} alt="" width="500" height="480" />
      </div>
    );
  }
}

export default EasterEgg;
