describe('Parallel Coordinates renders with D3', () => {
  it('renders without crashing', () => {});

  it('render the correct number of metric-axis from the data', () => {});

  it('run-lines should be limited to less than 10, even if its more than 10 from the data', () => {});

  it('text from the tick-values should be displayed in ascending order', () => {});

  it('tick-values are only highlighted once per axis', () => {});

  it('shows tooltip when tooltip prop sets as visible', () => {});

  it('hides tooltip when tooltip prop does not set as visible', () => {});
});

describe('Parallel Coordinates" interactions', () => {
  it('applies "run-line--hovered" to the run line when hovering over', () => {});

  it('applies "run-line--faded" to all the run lines that are not included in the hovered modes', () => {});

  it('applies "text--hovered" to the tick values when hovering over', () => {});

  it('applies "text--faded" to all the tick values that are not included in the hovered modes', () => {});

  it('applies "line--hovered" to the tick lines when hovering over', () => {});

  it('applies "line--faded" to all the tick lines that are not included in the hovered modes', () => {});

  it('applies "metric-axis--hovered" to the metric-axis when hovering over', () => {});

  it('applies "metric-axis--faded" to all the metric-axis that are not included in the hovered modes', () => {});

  it('in single run, applies "run-line--selected-first" class to "line" when selecting a new run', () => {});

  it('in comparison mode, applies classnames accordingly to "line"', () => {});
});
