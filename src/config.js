import { sanitizedPathname } from './utils';

export const localStorageName = 'KedroViz';
export const localStorageFlowchartLink = 'KedroViz-link-to-flowchart';
export const localStorageShareableUrl = 'KedroViz-shareable-url';
export const localStorageFeedbackSeen = 'KedroViz-feedback-seen';
export const localStorageBannerStatus = 'KedroViz-banners';
export const localStorageLastRunEndTime = 'KedroViz-workflow-last-run-end-time';

export const linkToFlowchartInitialVal = {
  fromURL: null,
  showGoBackBtn: false,
};

// These values are used in both SCSS and JS, and we don't have variable-sharing
// across Sass and JavaScript, so they're defined in two places. If you update their
// value here, please also update their corresponding value in src/styles/_variables.scss
export const globalToolbarWidth = 80;

export const metaSidebarWidth = {
  closed: 0,
  open: 400,
};

export const sidebarWidth = {
  breakpoint: 700,
  closed: 56 + globalToolbarWidth,
  open: 400 + globalToolbarWidth,
  pipelineUI: 344,
};

export const codeSidebarWidth = {
  closed: 0,
  open: 480,
};

export const workflowNodeDetailsWidth = 180;
export const workflowNodeDetailsHeight = 60;

export const workFlowStatuses = ['success', 'failed'];
// The exact fixed height of a row as measured by getBoundingClientRect()
export const nodeListRowHeight = 32;

export const chartMinWidthScale = 0.25;

// Determine the number of nodes and edges in pipeline to trigger size warning
export const largeGraphThreshold = 1000;

// Remember to update the 'Flags' section in the README when updating these:
export const flags = {
  sizewarning: {
    name: 'Size warning',
    description: 'Show a warning before rendering very large graphs',
    default: true,
    icon: '🐳',
  },
};

export const settings = {
  isPrettyName: {
    name: 'Pretty name',
    description: 'Display a formatted name for the kedro nodes',
    default: false,
  },
  showFeatureHints: {
    name: 'New feature hints',
    description: 'Enable or disable all new feature hints in the interface.',
    default: true,
  },
  showDatasetPreviews: {
    name: 'Dataset previews',
    description: 'Display preview data for all datasets.',
    default: true,
  },
};

// Sidebar groups is an ordered map of { id: label }
export const sidebarGroups = {
  elementType: 'Element types',
  tag: 'Tags',
};

// Sidebar element types is an ordered map of { id: label }
export const sidebarElementTypes = {
  task: 'Nodes',
  data: 'Datasets',
  parameters: 'Parameters',
};

export const shortTypeMapping = {
  'plotly.plotly_dataset.PlotlyDataset': 'plotly',
  'plotly.json_dataset.JSONDataset': 'plotly',
  'matplotlib.matplotlib_writer.MatplotlibWriter': 'image',
  'plotly.plotly_dataset.PlotlyDataSet': 'plotly',
  'plotly.json_dataset.JSONDataSet': 'plotly',
};

// URL parameters for each element/section
export const params = {
  focused: 'fid',
  selected: 'sid',
  selectedName: 'sn',
  pipeline: 'pid',
  run: 'run_ids',
  view: 'view',
  comparisonMode: 'comparison',
  types: 'types',
  tags: 'tags',
  expandAll: 'expandAllPipelines',
};

const activePipeline = `${params.pipeline}=:pipelineId`;
const pathname = sanitizedPathname();

export const routes = {
  flowchart: {
    main: pathname,
    focusedNode: `${pathname}?${activePipeline}&${params.focused}=:id`,
    selectedNode: `${pathname}?${activePipeline}&${params.selected}=:id`,
    selectedName: `${pathname}?${activePipeline}&${params.selectedName}=:fullName`,
    selectedPipeline: `${pathname}?${activePipeline}`,
  },
};

export const errorMessages = {
  node: 'Please check the value of "selected_id"/"sid" or "selected_name"/"sn" in the URL',
  modularPipeline: 'Please check the value of "focused_id"/"fid" in the URL',
  pipeline: 'Please check the value of "pipeline_id"/"pid" in the URL',
  tag: 'Please check the value of "tags" in the URL',
};

export const datasetStatLabels = ['rows', 'columns', 'file_size'];

export const statsRowLen = 33;

export const hostingPlatforms = {
  aws: 'Amazon Web Services',
  gcp: 'Google Cloud',
  azure: 'Microsoft Azure',
};

export const shareableUrlMessages = (status, info = '') => {
  const messages = {
    failure: 'Something went wrong. Please try again later.',
    loading: 'Shooting your files through space. Sit tight...',
    success:
      'The deployment has been successful and Kedro-Viz is hosted via the link below..',
    incompatible: `Publishing Kedro-Viz is only supported with fsspec>=2023.9.0. You are currently on version ${info}.\n\nPlease upgrade fsspec to a supported version and ensure you're using Kedro 0.18.2 or above.`,
  };

  return messages[status];
};

export const inputKeyToStateKeyMap = {
  // eslint-disable-next-line camelcase
  bucket_name: 'hasBucketName',
  platform: 'hasPlatform',
  endpoint: 'hasEndpoint',
};

export const PACKAGE_FSSPEC = 'fsspec';

export const KEDRO_VIZ_DOCS_URL =
  'https://docs.kedro.org/projects/kedro-viz/en/stable/';
export const KEDRO_VIZ_PUBLISH_DOCS_URL = `${KEDRO_VIZ_DOCS_URL}share_kedro_viz/`;
export const KEDRO_VIZ_PREVIEW_DATASETS_DOCS_URL = `${KEDRO_VIZ_DOCS_URL}preview_datasets/#disabling-previews`;
export const KEDRO_VIZ_PUBLISH_AWS_DOCS_URL = `${KEDRO_VIZ_DOCS_URL}publish_and_share_kedro_viz_on_aws/#set-up-endpoint`;
export const KEDRO_VIZ_PUBLISH_AZURE_DOCS_URL = `${KEDRO_VIZ_DOCS_URL}publish_and_share_kedro_viz_on_azure/#set-up-endpoint`;
export const KEDRO_VIZ_PUBLISH_GCP_DOCS_URL = `${KEDRO_VIZ_DOCS_URL}publish_and_share_kedro_viz_on_gcp/#set-up-endpoint`;

export const defaultQueryParams = [
  params.types,
  params.tags,
  params.expandAll,
  params.pipeline,
];

export const NODE_TYPES = {
  task: { name: 'nodes', defaultState: false },
  data: { name: 'datasets', defaultState: false },
  parameters: { name: 'parameters', defaultState: true },
};

export const BANNER_METADATA = {
  liteModeWarning: {
    title: 'Lite mode enabled',
    body: 'Some features might be disabled in --lite mode due to missing dependencies. You can find more information about lite mode in our docs.',
    docsLink:
      'https://docs.kedro.org/projects/kedro-viz/en/stable/kedro-viz_visualisation/#visualise-a-kedro-project-without-installing-project-dependencies',
  },
};

export const BANNER_KEYS = {
  LITE: 'lite',
};

export const VIEW = {
  WORKFLOW: 'workflow',
  FLOWCHART: 'flowchart',
};

export const PIPELINE = {
  DEFAULT: '__default__',
};
