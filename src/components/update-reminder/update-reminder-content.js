export const updateContent = {
  date: '29 July 2024',
  features: [
    {
      title:
        '`Enable`/`disable` dataset preview in Kedro-Viz instance or when publishing',
      image: '',
      copy: 'Users can now `enable` or `disable` the preview for all datasets in their local Kedro-Viz instance by using the toggle in the settings menu. Moreover, it can also be toggled when publishing Kedro-Viz from both the CLI and UI.',
      buttonLink:
        'https://docs.kedro.org/projects/kedro-viz/en/latest/preview_datasets.html#disabling-previews',
      buttonText: 'View the docs',
    },
    {
      title:
        'Move session store and stats file to `.viz` directory conditionally',
      image: '',
      copy: 'The session store (a SQLite database) and stats file are now conditionally moved to the `.viz` directory. If the user does not provide `SESSION_STORE_ARGS` in their `settings.py` file, Kedro-Viz will use the default `.viz` directory to store session and stats files.',
      buttonLink: '',
      buttonText: '',
    },
    {
      title: 'Enhance documentation for Kedro-Viz standalone React component',
      image: '',
      copy: 'The documentation for the Kedro-Viz standalone React component has been enhanced. It now includes a detailed props explanation, UI component annotation screenshot, and a new section dedicated to using Kedro-Viz as a standalone React component.',
      buttonLink: 'https://www.npmjs.com/package/@quantumblack/kedro-viz',
      buttonText: 'View the docs',
    },
    {
      title: 'Display published URLs',
      image: '',
      copy: 'Kedro-Viz now displays published URLs, allowing users to easily access and share the locations where their Kedro-Viz instances are hosted. This feature stores the hosting platform, bucket name, and endpoint URL in `localStorage`.',
      buttonLink: '',
      buttonText: '',
    },
  ],
};
