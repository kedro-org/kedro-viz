// https://github.com/plotly/react-plotly.js/issues/115
if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = () => {};
}
