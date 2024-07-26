export const updateContent = {
  date: '25 July 2024',
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
        'Introduce `--include-hooks` option and remove `--ignore-plugins` from CLI commands',
      image: '',
      copy: 'To run hooks while running `kedro viz`, you must now include the `--include-hooks` option in the Viz CLI commands and the `%run_viz` Jupyter line magic. This change ensures hooks are executed only when explicitly requested.',
      buttonLink: '',
      buttonText: '',
    },
    {
      title: 'Upgrade Kedro-Viz to Node 18',
      image: '',
      copy: 'Kedro-Viz has upgraded from Node v16 to v18.',
      buttonLink: '',
      buttonText: '',
    },
    {
      title: 'Enable/disable dataset preview when publishing Kedro-Viz',
      image: '',
      copy: 'Users can now enable or disable the preview for all datasets when publishing Kedro-Viz from both the CLI and UI.',
      buttonLink: '',
      buttonText: '',
    },
    {
      title: 'Display published URLs',
      image: '',
      copy: 'Kedro-Viz now displays published URLs.',
      buttonLink: '',
      buttonText: '',
    },
    {
      title:
        'Move session store and stats file to .viz directory conditionally',
      image: '',
      copy: 'The session store and stats file are now conditionally moved to the .viz directory.',
      buttonLink: '',
      buttonText: '',
    },
  ],
};
