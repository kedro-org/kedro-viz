/* eslint-disable camelcase, no-unused-vars */
export const statusMockData = {
  nodes: {
    '69c523b6': {
      name: 'ingestion.apply_types_to_companies',
      type: 'task',
      status: 'success',
      duration_sec: 0.020730291958898306,
      error: null,
    },
    ea604da4: {
      name: 'ingestion.apply_types_to_reviews',
      type: 'task',
      status: 'success',
      duration_sec: 0.016537458868697286,
      error: null,
    },
    f33b9291: {
      name: 'ingestion.apply_types_to_shuttles',
      type: 'task',
      status: 'failed',
      duration_sec: 0.04536341596394777,
      error: null,
    },
    '8de402c1': {
      name: 'ingestion.company_agg',
      type: 'task',
      status: 'success',
      duration_sec: 0.6332297078333795,
      error: null,
    },
    cb5166f3: {
      name: 'ingestion.combine_step',
      type: 'task',
      status: 'success',
      duration_sec: 0.05509637505747378,
      error: null,
    },
    '04ba733a': {
      name: 'feature_engineering.create_derived_features([prm_spine_table;prm_shuttle_company_reviews;params:feature_engineering.feature.derived]) -> [feature_engineering.feat_derived_features]',
      type: 'task',
      status: 'success',
      duration_sec: 0.021556375082582235,
      error: null,
    },
    '7932e672': {
      name: 'feature_engineering.create_feature_importance([prm_spine_table]) -> [feature_importance_output]',
      type: 'task',
      status: 'success',
      duration_sec: 0.0043736661318689585,
      error: null,
    },
    e50f81b8: {
      name: 'feature_engineering.create_static_features([prm_shuttle_company_reviews;params:feature_engineering.feature.static]) -> [feature_engineering.feat_static_features]',
      type: 'task',
      status: 'success',
      duration_sec: 0.021293167024850845,
      error: null,
    },
    '9a6ef457': {
      name: 'ingestion.<lambda>([prm_spine_table]) -> [ingestion.prm_spine_table_clone]',
      type: 'task',
      status: 'success',
      duration_sec: 0.004003250040113926,
      error: null,
    },
    be6b7919: {
      name: 'reporting.create_matplotlib_chart([prm_shuttle_company_reviews]) -> [reporting.confusion_matrix]',
      type: 'task',
      status: 'success',
      duration_sec: 0.32629300002008677,
      error: null,
    },
    '44ef9b48': {
      name: 'reporting.get_top_shuttles_data([prm_shuttle_company_reviews]) -> [reporting.top_shuttle_data]',
      type: 'task',
      status: 'success',
      duration_sec: 0.020017917035147548,
      error: null,
    },
    c7646ea1: {
      name: 'reporting.make_cancel_policy_bar_chart([prm_shuttle_company_reviews]) -> [reporting.cancellation_policy_breakdown]',
      type: 'task',
      status: 'success',
      duration_sec: 0.01677183387801051,
      error: null,
    },
    '3fb71518': {
      name: 'reporting.make_price_analysis_image([prm_shuttle_company_reviews]) -> [reporting.cancellation_policy_grid]',
      type: 'task',
      status: 'success',
      duration_sec: 0.01262691686861217,
      error: null,
    },
    40886786: {
      name: 'reporting.make_price_histogram([prm_shuttle_company_reviews]) -> [reporting.price_histogram]',
      type: 'task',
      status: 'success',
      duration_sec: 0.1268374160863459,
      error: null,
    },
    '6ea2ec2c': {
      name: 'feature_engineering.joiner([prm_spine_table;feature_engineering.feat_static_features;feature_engineering.feat_derived_features]) -> [model_input_table]',
      type: 'task',
      status: 'success',
      duration_sec: 0.019039916805922985,
      error: null,
    },
    '4adb5c8b': {
      name: 'reporting.create_feature_importance_plot([feature_importance_output]) -> [reporting.feature_importance]',
      type: 'task',
      status: 'success',
      duration_sec: 0.0466410000808537,
      error: null,
    },
    '2816ba38': {
      name: 'split_data([model_input_table;params:split_options]) -> [X_train;X_test;y_train;y_test]',
      type: 'task',
      status: 'success',
      duration_sec: 0.017614749958738685,
      error: null,
    },
    af9a43c8: {
      name: 'train_evaluation.linear_regression.train_model([X_train;y_train;params:train_evaluation.model_options.linear_regression]) -> [train_evaluation.linear_regression.regressor;train_evaluation.linear_regression.experiment_params]',
      type: 'task',
      status: 'failed',
      duration_sec: 0.26918208389542997,
      error: null,
    },
    '038647c7': {
      name: 'train_evaluation.random_forest.train_model([X_train;y_train;params:train_evaluation.model_options.random_forest]) -> [train_evaluation.random_forest.regressor;train_evaluation.random_forest.experiment_params]',
      type: 'task',
      status: 'success',
      duration_sec: 9.591613417025656,
      error: null,
    },
    d2885635: {
      name: 'train_evaluation.linear_regression.evaluate_model([train_evaluation.linear_regression.regressor;X_test;y_test]) -> [train_evaluation.linear_regression.r2_score]',
      type: 'task',
      status: 'success',
      duration_sec: 0.007663041818886995,
      error: null,
    },
    bf8530bc: {
      name: 'train_evaluation.random_forest.evaluate_model([train_evaluation.random_forest.regressor;X_test;y_test]) -> [train_evaluation.random_forest.r2_score]',
      type: 'task',
      status: 'failed',
      duration_sec: 0.13402137509547174,
      error: null,
    },
  },
  datasets: {
    aed46479: {
      name: 'companies',
      size_bytes: 13998272,
      error: 'the error comes from the log',
    },
    f23ad217: {
      size_bytes: 6246118,
      name: 'ingestion.int_typed_companies',
    },
    '7b2c6e04': {
      name: 'reviews',
      size_bytes: 6167824,
    },
    b5609df0: {
      name: 'params:ingestion.typing.reviews.columns_as_floats',
      size_bytes: 88,
    },
    '4f7ffa1b': {
      name: 'ingestion.int_typed_reviews',
      size_bytes: 5355856,
    },
    f1d596c2: {
      name: 'shuttles',
      size_bytes: 42831629,
    },
    c0ddbcbf: {
      name: 'ingestion.int_typed_shuttles@pandas1',
      size_bytes: 29647753,
    },
    '8f20d98e': {
      name: 'ingestion.prm_agg_companies',
      size_bytes: 3920426,
    },
    '9f266f06': {
      name: 'prm_shuttle_company_reviews',
      size_bytes: 16531446,
    },
    f063cc82: {
      name: 'prm_spine_table',
      size_bytes: 952592,
    },
    abed6a4d: {
      name: 'params:feature_engineering.feature.derived',
      size_bytes: 88,
    },
    '7c92a703': {
      name: 'feature_engineering.feat_derived_features',
      size_bytes: 714576,
    },
    '1e3cc50a': {
      name: 'feature_importance_output',
      size_bytes: 1259,
    },
    a3627e31: {
      name: 'params:feature_engineering.feature.static',
      size_bytes: 184,
    },
    '8e4f1015': {
      name: 'feature_engineering.feat_static_features',
      size_bytes: 2470760,
    },
    c08c7708: {
      name: 'ingestion.prm_spine_table_clone',
      size_bytes: 952592,
    },
    '3b199c6b': {
      name: 'reporting.confusion_matrix',
      size_bytes: 72,
    },
    c0be8342: {
      name: 'reporting.top_shuttle_data',
      size_bytes: 120,
    },
    d0e9b00f: {
      name: 'reporting.cancellation_policy_breakdown',
      size_bytes: 3151,
    },
    '8838ca1f': {
      name: 'reporting.cancellation_policy_grid',
      size_bytes: 48,
    },
    c6992660: {
      name: 'reporting.price_histogram',
      size_bytes: 48,
    },
    '23c94afb': {
      name: 'model_input_table',
      size_bytes: 2232744,
    },
    eb7d6d28: {
      name: 'reporting.feature_importance',
      size_bytes: 48,
    },
    '22eec376': {
      name: 'params:split_options',
      size_bytes: 232,
    },
    cae2d1c7: {
      name: 'X_train',
      size_bytes: 1786066,
    },
    '872981f9': {
      name: 'X_test',
      size_bytes: 446566,
    },
    '9ca016a8': {
      name: 'y_train',
      size_bytes: 381040,
    },
    f6d9538c: {
      name: 'y_test',
      size_bytes: 95280,
    },
    '98eb115e': {
      name: 'params:train_evaluation.model_options.linear_regression',
      size_bytes: 232,
    },
    '10e51dea': {
      name: 'train_evaluation.linear_regression.regressor',
      size_bytes: 48,
    },
    b701864d: {
      name: 'train_evaluation.linear_regression.experiment_params',
      size_bytes: 232,
    },
    '72baf5c6': {
      name: 'params:train_evaluation.model_options.random_forest',
      size_bytes: 232,
    },
    '01675921': {
      name: 'train_evaluation.random_forest.regressor',
      size_bytes: 48,
    },
    '4f79de77': {
      name: 'train_evaluation.random_forest.experiment_params',
      size_bytes: 640,
    },
    '495a0bbc': {
      name: 'train_evaluation.linear_regression.r2_score',
      size_bytes: 232,
    },
    b16095d0: {
      name: 'train_evaluation.random_forest.r2_score',
      size_bytes: 232,
    },
  },
  pipeline: {
    run_id: 'bbfe98a2-2cb9-4933-9b32-0c407975a25e',
    start_time: null,
    end_time: null,
    total_duration_sec: 1.410506376530975,
    status: 'failed',
    error:
      "Failed while loading data from dataset CSVDataset(filepath=/Users/Jitendra_Gundaniya/QB/kedro-viz-run-ws/kedro-viz/demo-project/data/01_raw/companies.csv, load_args={}, protocol=file, save_args={'index': False}).\n[Errno 2] No such file or directory: '/Users/Jitendra_Gundaniya/QB/kedro-viz-run-ws/kedro-viz/demo-project/data/01_raw/companies.csv'",
  },
};
