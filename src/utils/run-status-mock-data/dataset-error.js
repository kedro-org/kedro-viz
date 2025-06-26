/* eslint-disable camelcase, no-unused-vars */
export const datasetError = {
  nodes: {
    '69c523b6': {
      status: 'Success',
      duration: 0.019043750129640102,
      error: null,
    },
    ea604da4: {
      status: 'Success',
      duration: 0.01412695785984397,
      error: null,
    },
  },
  datasets: {
    aed46479: {
      name: 'companies',
      size: 1810602,
      status: 'Available',
      error: null,
    },
    f23ad217: {
      name: 'ingestion.int_typed_companies',
      size: 550104,
      status: 'Available',
      error: null,
    },
    '7b2c6e04': {
      name: 'reviews',
      size: 2937144,
      status: 'Available',
      error: null,
    },
    b5609df0: {
      name: 'params:ingestion.typing.reviews.columns_as_floats',
      size: 0,
      status: 'Available',
      error: null,
    },
    '4f7ffa1b': {
      name: 'ingestion.int_typed_reviews',
      size: 1334176,
      status: 'Available',
      error: null,
    },
    f1d596c2: {
      name: 'shuttles',
      size: 0,
      status: 'Missing',
      error: {
        message:
          "Failed while loading data from dataset ExcelDataset(filepath=/Users/Jitendra_Gundaniya/QB/kedro-viz-run-ws/kedro-viz/demo-project/data/01_raw/shuttles.xlsx, load_args={'engine': openpyxl}, protocol=file, save_args={'index': False}, writer_args={'engine': openpyxl}).\n[Errno 2] No such file or directory: '/Users/Jitendra_Gundaniya/QB/kedro-viz-run-ws/kedro-viz/demo-project/data/01_raw/shuttles.xlsx'",
        error_node: 'apply_types_to_shuttles',
        error_operation: 'Loading',
      },
    },
  },
  pipeline: {
    run_id: '174089d2-5f5c-4eae-9d2d-162f76fb3304',
    start_time: '2025-05-22T15:59:43.068383',
    end_time: '2025-05-22T15:59:44.186068',
    duration: 1.117685,
    status: 'failed',
    error:
      "Failed while loading data from dataset ExcelDataset(filepath=/Users/Jitendra_Gundaniya/QB/kedro-viz-run-ws/kedro-viz/demo-project/data/01_raw/shuttles.xlsx, load_args={'engine': openpyxl}, protocol=file, save_args={'index': False}, writer_args={'engine': openpyxl}).\n[Errno 2] No such file or directory: '/Users/Jitendra_Gundaniya/QB/kedro-viz-run-ws/kedro-viz/demo-project/data/01_raw/shuttles.xlsx'",
  },
};
