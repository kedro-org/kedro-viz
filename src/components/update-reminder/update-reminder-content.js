export const updateContent = {
  date: '21 November 2024',
  features: [
    {
      title: 'Support for Python 3.12 and 3.13',
      image: '',
      copy: 'Kedro-Viz now supports Python 3.12 and 3.13, ensuring compatibility with the latest Python version.',
      buttonLink:
        'https://github.com/kedro-org/kedro-viz?tab=readme-ov-file#usage',
      buttonText: 'Learn more',
    },
    {
      title: 'Consistent Flowchart Positioning',
      image: '',
      copy: 'Flowchart positions now remain consistent across renders. Previously, the flowchart layout would change every time users made changes to their Kedro project, especially when using the` --autoreload` function. This issue has been resolved, and the layout will only change for significant node or pipeline updates.',
      buttonLink: '',
    },
    {
      title: 'Smarter `--autoreload` File Watcher',
      image: '',
      copy: 'The `--autoreload` watcher has been optimized to monitor only relevant files, reducing unnecessary reloads. It now excludes files listed in the user’s .gitignore and focuses on key files like `.py` and `.yaml`.',
      buttonLink:
        'https://docs.kedro.org/projects/kedro-viz/en/latest/kedro-viz_visualisation.html#automatic-visualisation-updates',
      buttonText: 'View the docs',
    },
    {
      title: 'Improved Port Management',
      image: '',
      copy: 'Kedro-Viz will now open on a new port if the default port 4141 is already in use. This fixes an issue where running multiple instances of Kedro-Viz caused one to overwrite the other. For example, if 4141 is occupied, the next instance will use 4142, and so on.',
      buttonLink: '',
    },
    {
      title: 'Fixed Tag Undefined Issue',
      image: '',
      copy: 'Resolved a bug where the tag was occasionally undefined when pipelines were ordered differently in the pipeline registry. This was a user-reported issue, and it’s now fully addressed.',
      buttonLink: '',
    },
  ],
};
