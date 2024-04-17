export const updateContent = {
  date: '17 April 2024',
  features: [
    {
      title:
        'Enable stateful URLs with node filters and expand/collapse modular pipelines',
      image: '',
      copy: 'Kedro-Viz now supports stateful URLs that update to reflect user interactions, specifically when filtering nodes or expanding/collapsing modular pipelines. This allows users to share URLs that capture and share specific views of the data pipeline.',
      buttonLink:
        'https://docs.kedro.org/projects/kedro-viz/en/latest/share_kedro_viz.html#filtering-and-sharing-kedro-viz-pipelines',
      buttonText: 'View the docs',
    },
    {
      title:
        'Introduce `--include-hooks` option and remove `--ignore-plugins` from cli commands',
      image: '',
      copy: 'To run hooks while running `kedro viz`, you must now include the `--include-hooks` option in the Viz CLI commands and the `%run_viz` Jupyter line magic. This change ensures hooks are executed only when explicitly requested, as they are no longer run by default in Kedro-Viz.',
      buttonLink: '',
      buttonText: '',
    },
    {
      title: 'Upgrade Kedro-Viz to Node 18',
      image: '',
      copy: 'Kedro-Viz has upgraded from Node v16 to v18',
      buttonLink: '',
      buttonText: '',
    },
  ],
};
