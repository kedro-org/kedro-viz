export const featureHintsContent = [
  {
    title: 'Preview your datasets in the metadata panel',
    description:
      'View a small preview of datasets by clicking on a node and opening the metadata panel. The ability to expand to view a larger preview is also possible when the panel is open. Along with a preview, there will also be information about your dataset, such as the file path and the dataset type.',
    learnMoreLink:
      'https://docs.kedro.org/en/latest/visualisation/preview_datasets.html',
    elementId: '#nodes .pipeline-node--data:first-of-type .pipeline-node__bg',
  },
  {
    title: 'Plotly and Matplotlib',
    description:
      'Kedro-Viz supports integration with Plotly and Matplotlib in order to make interactive visualisations of a Kedro project.',
    learnMoreLink:
      'https://docs.kedro.org/en/stable/visualisation/visualise_charts_with_plotly.html',
    elementId: '.pipeline-node__bg--plotly',
  },
  {
    title: 'Experiment tracking',
    description:
      'Experiment tracking is the process of saving all the metadata related to an experiment each time you run it. It enables you to compare different runs of a machine-learning model as part of the experimentation process.',
    learnMoreLink:
      'https://docs.kedro.org/en/stable/experiment_tracking/index.html',
    elementId: '#experiment-tracking-nav-button',
  },
  {
    title: 'Filters and tags',
    description: 'Copy goes here...',
    elementId: '.pipeline-nodelist-section__title span',
  },
  {
    title: 'Settings panel',
    description: 'Copy goes here...',
    elementId: '.pipeline-menu-button--settings',
  },
  {
    title: 'Export visualisation',
    description: 'Copy goes here...',
    elementId: '.pipeline-menu-button--export',
  },
];
