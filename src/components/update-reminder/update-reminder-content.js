export const updateContent = {
  date: '03 February 2025',
  features: [
    {
      title: 'Deprecation warning for Experiment Tracking removal',
      image: '',
      copy: 'Experiment Tracking on Kedro-viz will be deprecated in Kedro-Viz 11.0.0. Please refer to the Kedro documentation for migration guidance.',
      buttonLink:
        'https://docs.kedro.org/projects/kedro-viz/en/latest/migrate_experiment_tracking.html',
      buttonText: 'View the docs',
    },
    {
      title:
        'Fix kedro viz `--load-file` to run from any directory without requiring a Kedro project. ',
      image: '',
      copy: 'Kedro viz `--load-file` can run from anywhere as long as it has the correct path to the API data directory .',
      buttonLink: '',
    },
    {
      title:
        'Improved modular pipeline expand/collapse logic for better state synchronisation',
      image: '',
      copy: 'Previously the Expand All Pipelines button did a data reload every time it was clicked, now it purely relies on redux actions.',
      buttonLink: '',
    },
  ],
};
