const palette = {
  themes: {
    light: {
      base: {
        primary: 'rgb(27, 117, 240)',
        secondary: 'rgb(80, 170, 222)',
        default: 'rgb(240, 241, 243)'
      },
      chart: {
        colors: [
          'hotpink',
          'cornflowerblue',
          'chartreuse',
          'crimson',
          'darkcyan',
          'navajowhite'
        ],
        crosshairs: {
          stroke: 'rgba(0, 0, 0, 0.55)'
        },
        area: {
          fill: 'rgba(0, 163, 222, 1)'
        },
        axis: {
          base: 'rgba(0, 0, 0, 0.85)',
          grid: 'rgba(0, 0, 0, 0.85)'
        },
        line: {
          stroke: 'rgba(0, 0, 0, 0.6)'
        },
        bar: {
          fill: 'hotpink',
          candlestroke: 'rgba(0, 0, 0, 0.85)'
        },
        tooltip: {
          fill: 'rgba(132, 142, 150, 1)'
        }
      },
      hover: {
        primary: 'rgb(25, 104, 209)',
        secondary: 'rgb(73, 149, 194)',
        default: 'rgb(208, 209, 210)'
      },
      focus: {
        primary: 'rgb(27, 117, 240)',
        secondary: 'rgb(80, 170, 222)',
        default: 'rgb(240, 241, 243)'
      },
      active: {
        primary: 'rgb(58, 137, 242)',
        secondary: 'rgb(141, 199, 224)',
        default: 'rgb(243, 244, 246)'
      },
      disabled: {
        primary: 'rgb(0, 174, 239)',
        secondary: 'rgb(211, 234, 247)',
        default: 'rgb(251, 251, 251)'
      },
      text: {
        default: 'rgba(0, 0, 0, 0.85)',
        secondary: 'rgba(0, 0, 0, 0.38)'
      },
      bg: {
        default: 'rgb(240, 241, 243)'
      },
      menu: {
        default: 'rgb(255, 255, 255)',
        hover: 'rgb(230, 232, 235)',
        active: 'rgb(29, 48, 59)',
        activeColor: 'rgb(255, 255, 255)',
        selected: 'rgba(0, 0, 0, 0.06)',
        border: 'rgba(0, 0, 0, 0.12)',
        wrapper: 'rgba(0, 0, 0, 0.12)'
      },
      button: {
        active: 'rgba(0, 0, 0, 0.85)',
        focus: 'rgba(0, 0, 0, 0.3)',
        outline: 'rgb(0, 0, 0)',
        textHover: 'rgba(255, 255, 255, 0.85)'
      },
      checkbox: {
        default: 'rgba(255, 255, 255, 0.55)'
      },
      radiobutton: {
        default: 'rgba(0, 0, 0, 0.55)',
        disabled: 'rgba(0, 0, 0, 0.35)',
        focus: 'rgba(0, 0, 0, 0.2)'
      },
      slider: {
        default: 'rgb(212, 213, 214)',
        focus: 'rgba(0, 0, 0, 0.2)',
        label: 'rgba(0, 0, 0, 0.85)',
        numberInputLine: 'rgba(0, 0, 0, 0.12)',
        thumbCenter: 'rgb(255, 255, 255)',
        thumbBorder: 'rgb(0, 0, 0)',
        tickNumber: 'rgba(0, 0, 0, 0.55)'
      },
      input: {
        placeholder: 'rgba(0, 0, 0, 0.3)',
        placeholderFocused: 'rgba(0, 0, 0, 0.55)',
        textFilled: 'rgb(0, 0, 0)',
        error: 'rgb(236, 53, 8)',
        success: 'rgb(0, 195, 41)',
        status: 'rgb(255, 255, 255)'
      },
      grid: {
        default: 'rgba(255, 105, 180, 0.5)'
      },
      search: {
        icon: 'rgba(0, 0, 0, 0.55)'
      },
      notifications: {
        background: 'rgba(255, 255, 255, 1);',
        label: 'rgba(0, 0, 0, 0.55)',
        headerLabel: 'rgba(0, 0, 0, 0.85)'
      },
      toggle: {
        default: 'rgba(0, 0, 0, 0.85)',
        hover: 'rgba(0, 0, 0, 0.6)',
        focus: 'rgba(0, 0, 0, 0.06)',
        disabled: 'rgba(0, 0, 0, 0.3)',
        active: 'rgba(0, 0, 0, 0.12)',
        underline: 'rgb(0, 0, 0)'
      },
      tabs: {
        default: 'rgba(0, 0, 0, 0.55)',
        border: 'rgba(0, 0, 0, 0.12)',
        active: 'rgba(0, 0, 0, 0.12)',
        selected: 'rgb(0, 0, 0)'
      },
      tooltip: {
        default: 'rgba(132, 142, 150, 1)',
        text: 'rgba(255, 255, 255, 0.85)'
      }
    },
    dark: {
      base: {
        primary: 'rgb(27, 117, 240)',
        secondary: 'rgb(80, 170, 222)',
        default: 'rgb(85, 99, 108)'
      },
      chart: {
        colors: [
          'hotpink',
          'cornflowerblue',
          'chartreuse',
          'crimson',
          'darkcyan',
          'navajowhite'
        ],
        crosshairs: {
          stroke: 'rgba(255, 255, 255, 0.55)'
        },
        area: {
          fill: 'rgba(0, 163, 222, 1)'
        },
        axis: {
          base: 'rgba(255, 255, 255, 0.85)',
          grid: 'rgba(255, 255, 255, 0.55)'
        },
        line: {
          stroke: 'rgba(255, 255, 255, 0.7)'
        },
        bar: {
          fill: 'hotpink',
          candlestroke: 'rgba(255, 255, 255, 0.85)'
        },
        tooltip: {
          fill: 'rgba(132, 142, 150, 1)'
        }
      },
      hover: {
        primary: 'rgb(25, 104, 209)',
        secondary: 'rgb(73, 149, 194)',
        default: 'rgb(67, 76, 81)'
      },
      focus: {
        primary: 'rgb(27, 117, 240)',
        secondary: 'rgb(80, 170, 222)',
        default: 'rgb(85, 99, 108)'
      },
      active: {
        primary: 'rgb(58, 137, 242)',
        secondary: 'rgb(141, 199, 224)',
        default: 'rgb(119, 130, 137)'
      },
      disabled: {
        primary: 'rgb(0, 174, 239)',
        secondary: 'rgb(211, 234, 247)',
        default: 'rgb(17, 32, 42)'
      },
      text: {
        default: 'rgba(255, 255, 255, 0.85)',
        secondary: 'rgba(255, 255, 255, 0.55)'
      },
      bg: {
        default: 'rgb(29, 48, 59)'
      },
      menu: {
        default: 'rgb(55, 70, 80)',
        hover: 'rgb(79, 92, 101)',
        active: 'rgb(29, 48, 59)',
        activeColor: 'rgb(255, 255, 255)',
        selected: 'rgba(255, 255, 255, 0.05)',
        border: 'rgba(255, 255, 255, 0.12)',
        wrapper: 'rgba(0, 0, 0, 0)'
      },
      button: {
        active: 'rgba(255, 255, 255, 0.85)',
        focus: 'rgba(255, 255, 255, 0.3)',
        outline: 'rgb(255, 255, 255)',
        textHover: 'rgba(0, 0, 0, 0.85)'
      },
      checkbox: {
        default: 'rgba(0, 0, 0, 0.55)'
      },
      radiobutton: {
        default: 'rgba(255, 255, 255, 0.55)',
        disabled: 'rgba(255, 255, 255, 0.35)',
        focus: 'rgba(255, 255, 255, 0.2)'
      },
      slider: {
        default: 'rgb(96, 110, 117)',
        focus: 'rgba(255, 255, 255, 0.2)',
        label: 'rgba(255, 255, 255, 0.85)',
        numberInputLine: 'rgba(255, 255, 255, 0.12)',
        thumbCenter: 'rgb(0, 0, 0)',
        thumbBorder: 'rgb(255, 255, 255)',
        tickNumber: 'rgba(255, 255, 255, 0.55)'
      },
      input: {
        placeholder: 'rgba(255, 255, 255, 0.3)',
        placeholderFocused: 'rgba(255, 255, 255, 0.55)',
        textFilled: 'rgb(255, 255, 255)',
        error: 'rgb(236, 53, 8)',
        success: 'rgb(0, 195, 41)',
        status: 'rgb(255, 255, 255)'
      },
      grid: {
        default: 'rgba(100, 149, 237, 0.5)'
      },
      search: {
        icon: 'rgba(255, 255, 255, 0.55)'
      },
      notifications: {
        background: 'rgba(42, 59, 70, 1);',
        label: 'rgba(255, 255, 255, 0.55)',
        headerLabel: 'rgba(255, 255, 255, 0.85)'
      },
      toggle: {
        default: 'rgba(255, 255, 255, 0.85)',
        hover: 'rgba(255, 255, 255, 0.6)',
        focus: 'rgba(255, 255, 255, 0.06)',
        disabled: 'rgba(255, 255, 255, 0.3)',
        active: 'rgba(0, 0, 0, 0.12)',
        underline: 'rgb(255, 255, 255)'
      },
      tabs: {
        default: 'rgba(255, 255, 255, 0.55)',
        border: 'rgba(255, 255, 255, 0.12)',
        active: 'rgba(0, 0, 0, 0.12)',
        selected: 'rgb(255, 255, 255)'
      },
      tooltip: {
        default: 'rgba(132, 142, 150, 1)',
        text: 'rgba(255, 255, 255, 0.85)'
      }
    }
  }
};

export default palette;
