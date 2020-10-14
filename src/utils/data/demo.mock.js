export default {
  selected_pipeline: '__default__',
  pipelines: [
    {
      id: '__default__',
      name: 'Default'
    },
    {
      id: 'de',
      name: 'Data engineering'
    },
    {
      id: 'ds',
      name: 'Data science'
    }
  ],
  layers: [
    'Raw',
    'Intermediate',
    'Primary',
    'Feature',
    'Model Input',
    'Models',
    'Model Output',
    'Reporting'
  ],
  edges: [
    {
      source: '33920f3a',
      target: '06c33e94'
    },
    {
      source: '06c33e94',
      target: '105160a0'
    },
    {
      source: '814ef273',
      target: '0b7e1ac6'
    },
    {
      source: '0b7e1ac6',
      target: '389b5286'
    },
    {
      source: '58450007',
      target: '22ea294c'
    },
    {
      source: '22ea294c',
      target: 'bcb40508'
    },
    {
      source: '105160a0',
      target: 'f1a163c4'
    },
    {
      source: 'f1a163c4',
      target: 'e44a096d'
    },
    {
      source: '389b5286',
      target: 'b2f97396'
    },
    {
      source: 'b2f97396',
      target: '8c1dcc36'
    },
    {
      source: 'bcb40508',
      target: '27bb9dc7'
    },
    {
      source: '27bb9dc7',
      target: '13a964bf'
    },
    {
      source: '842a3580',
      target: 'fb5bd01d'
    },
    {
      source: 'e44a096d',
      target: 'fb5bd01d'
    },
    {
      source: '8c1dcc36',
      target: 'fb5bd01d'
    },
    {
      source: '13a964bf',
      target: 'fb5bd01d'
    },
    {
      source: 'fb5bd01d',
      target: '55bd1af4'
    },
    {
      source: '842a3580',
      target: 'd52422da'
    },
    {
      source: 'e44a096d',
      target: 'd52422da'
    },
    {
      source: '8c1dcc36',
      target: 'd52422da'
    },
    {
      source: '13a964bf',
      target: 'd52422da'
    },
    {
      source: 'd52422da',
      target: '442c2c34'
    },
    {
      source: '181c2b7c',
      target: 'dcbb9652'
    },
    {
      source: '057ade39',
      target: 'dcbb9652'
    },
    {
      source: 'dcbb9652',
      target: '7eb64be0'
    },
    {
      source: '181c2b7c',
      target: 'c4cff5d0'
    },
    {
      source: '42e79d42',
      target: 'c4cff5d0'
    },
    {
      source: 'c4cff5d0',
      target: '842a3580'
    },
    {
      source: '7eb64be0',
      target: '95cfc42d'
    },
    {
      source: '1b3afcba',
      target: '95cfc42d'
    },
    {
      source: '55bd1af4',
      target: '95cfc42d'
    },
    {
      source: '95cfc42d',
      target: '8770a38e'
    },
    {
      source: '95cfc42d',
      target: '1dafa5fb'
    },
    {
      source: '442c2c34',
      target: 'ccbee9c5'
    },
    {
      source: '3a60b3a4',
      target: 'ccbee9c5'
    },
    {
      source: 'ccbee9c5',
      target: 'fb4f64bd'
    },
    {
      source: 'ccbee9c5',
      target: 'f4f3a276'
    },
    {
      source: '1dafa5fb',
      target: '394244dd'
    },
    {
      source: '55bd1af4',
      target: '394244dd'
    },
    {
      source: '394244dd',
      target: '792a14f6'
    },
    {
      source: 'f4f3a276',
      target: '67257e84'
    },
    {
      source: '442c2c34',
      target: '67257e84'
    },
    {
      source: '67257e84',
      target: '9bd2dc3d'
    },
    {
      source: '1dafa5fb',
      target: 'f6f50e64'
    },
    {
      source: 'dff067eb',
      target: 'f6f50e64'
    },
    {
      source: '55bd1af4',
      target: 'f6f50e64'
    },
    {
      source: 'f6f50e64',
      target: '92f58611'
    },
    {
      source: 'dff067eb',
      target: 'e061482b'
    },
    {
      source: 'f4f3a276',
      target: 'e061482b'
    },
    {
      source: '442c2c34',
      target: 'e061482b'
    },
    {
      source: 'e061482b',
      target: 'b2a3a8e5'
    },
    {
      source: '792a14f6',
      target: '53b05b01'
    },
    {
      source: '8770a38e',
      target: '53b05b01'
    },
    {
      source: 'fb4f64bd',
      target: '6d8d326d'
    },
    {
      source: '9bd2dc3d',
      target: '6d8d326d'
    },
    {
      source: 'dff067eb',
      target: '45bda5fd'
    },
    {
      source: '9aeb6881',
      target: '45bda5fd'
    },
    {
      source: '92f58611',
      target: '45bda5fd'
    },
    {
      source: '45bda5fd',
      target: '90713d4f'
    },
    {
      source: 'dff067eb',
      target: '211c92c3'
    },
    {
      source: '92f58611',
      target: '211c92c3'
    },
    {
      source: '211c92c3',
      target: '4704ff18'
    },
    {
      source: 'dff067eb',
      target: 'c17b9614'
    },
    {
      source: '4704ff18',
      target: 'c17b9614'
    },
    {
      source: 'c17b9614',
      target: 'ccd3d45b'
    },
    {
      source: '90713d4f',
      target: '90461ea7'
    },
    {
      source: 'ccd3d45b',
      target: '90461ea7'
    },
    {
      source: '9bd2dc3d',
      target: '90461ea7'
    },
    {
      source: '792a14f6',
      target: '90461ea7'
    },
    {
      source: '4704ff18',
      target: '90461ea7'
    },
    {
      source: '90461ea7',
      target: '3e3b263a'
    },
    {
      source: '90461ea7',
      target: 'f3e15708'
    },
    {
      source: '90461ea7',
      target: '83ebce11'
    },
    {
      source: '90461ea7',
      target: 'a72d7024'
    },
    {
      source: '90461ea7',
      target: '8dbed427'
    }
  ],
  nodes: [
    {
      full_name: 'load_raw_interaction_data',
      id: '06c33e94',
      name: 'Load Raw Interaction Data',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Raw',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'load_raw_country_data',
      id: '0b7e1ac6',
      name: 'Load Raw Country Data',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Raw',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'load_raw_shopper_spend_data',
      id: '22ea294c',
      name: 'Load Raw Shopper Spend Data',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Raw',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'preprocess_intermediate_interaction_data',
      id: 'f1a163c4',
      name: 'Preprocess Intermediate Interaction Data',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Intermediate',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'preprocess_intermediate_country_data',
      id: 'b2f97396',
      name: 'Preprocess Intermediate Country Data',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Intermediate',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'preprocess_intermediate_shopper_spend_data',
      id: '27bb9dc7',
      name: 'Preprocess Intermediate Shopper Spend Data',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Intermediate',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'create_shopper_spend_features',
      id: 'fb5bd01d',
      name: 'Create Shopper Spend Features',
      tags: ['feature_engineering', 'data_engineering'],
      layer: 'Feature',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'create_shopper_churn_features',
      id: 'd52422da',
      name: 'Create Shopper Churn Features',
      tags: ['feature_engineering', 'data_engineering'],
      layer: 'Feature',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'prepare_vendor_input',
      id: 'dcbb9652',
      name: 'Prepare Vendor Input',
      tags: ['feature_engineering', 'data_engineering'],
      layer: 'Intermediate',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'prepare_crm_input',
      id: 'c4cff5d0',
      name: 'Prepare CRM Input',
      tags: ['feature_engineering', 'data_engineering'],
      layer: 'Intermediate',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'predictive_sales_model',
      id: '95cfc42d',
      name: 'Predictive Sales Model',
      tags: ['model_training', 'data_science'],
      layer: 'Model Input',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'predictive_engagement_model',
      id: 'ccbee9c5',
      name: 'Predictive Engagement Model',
      tags: ['model_training', 'data_science'],
      layer: 'Model Input',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'sales_model_explainable_ai',
      id: '394244dd',
      name: 'Sales Model Explainable AI',
      tags: ['model_explanation', 'data_science'],
      layer: 'Model Input',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'engagement_model_explainable_ai',
      id: '67257e84',
      name: 'Engagement Model Explainable AI',
      tags: ['model_explanation', 'data_science'],
      layer: 'Models',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'perform_digital_analysis',
      id: 'f6f50e64',
      name: 'Perform Digital Analysis',
      tags: ['model_training', 'data_science'],
      layer: 'Model Input',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'engagement_recommendation_engine',
      id: 'e061482b',
      name: 'Engagement Recommendation Engine',
      tags: ['model_training', 'data_science'],
      layer: 'Models',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'sales_model_performance_monitoring',
      id: '53b05b01',
      name: 'Sales Model Performance Monitoring',
      tags: ['model_performance_monitoring', 'data_science'],
      layer: 'Reporting',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'engagement_model_performance_monitoring',
      id: '6d8d326d',
      name: 'Engagement Model Performance Monitoring',
      tags: ['model_performance_monitoring', 'data_science'],
      layer: 'Reporting',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'multi-channel_optimisation',
      id: '45bda5fd',
      name: 'Multi-Channel Optimisation',
      tags: ['optimisation', 'data_science'],
      layer: 'Models',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'content_optimisation',
      id: '211c92c3',
      name: 'Content Optimisation',
      tags: ['optimisation', 'data_science'],
      layer: 'Models',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'segment_journeys',
      id: 'c17b9614',
      name: 'Segment Journeys',
      tags: ['optimisation', 'data_science'],
      layer: 'Model Output',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'generate_dashboard_inputs',
      id: '90461ea7',
      name: 'Generate Dashboard Inputs',
      tags: ['reporting', 'data_science'],
      layer: 'Reporting',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      full_name: 'interaction_raw',
      id: '33920f3a',
      name: 'Interaction Raw',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Raw',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    },
    {
      full_name: 'interaction_intermediate',
      id: '105160a0',
      name: 'Interaction Intermediate',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Intermediate',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    },
    {
      full_name: 'country_raw',
      id: '814ef273',
      name: 'Country Raw',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Raw',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    },
    {
      full_name: 'country_intermediate',
      id: '389b5286',
      name: 'Country Intermediate',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Intermediate',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    },
    {
      full_name: 'shopper_spend_raw',
      id: '58450007',
      name: 'Shopper Spend Raw',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Raw',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    },
    {
      full_name: 'shopper_spend_intermediate',
      id: 'bcb40508',
      name: 'Shopper Spend Intermediate',
      tags: ['data_engineering', 'preprocessing'],
      layer: 'Intermediate',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    },
    {
      full_name: 'interaction_primary',
      id: 'e44a096d',
      name: 'Interaction Primary',
      tags: ['feature_engineering', 'data_engineering', 'preprocessing'],
      layer: 'Primary',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    },
    {
      full_name: 'country_primary',
      id: '8c1dcc36',
      name: 'Country Primary',
      tags: ['feature_engineering', 'data_engineering', 'preprocessing'],
      layer: 'Primary',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    },
    {
      full_name: 'shopper_spend_primary',
      id: '13a964bf',
      name: 'Shopper Spend Primary',
      tags: ['feature_engineering', 'data_engineering', 'preprocessing'],
      layer: 'Primary',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    },
    {
      full_name: 'crm_predictions',
      id: '842a3580',
      name: 'CRM Predictions',
      tags: ['feature_engineering', 'data_engineering'],
      layer: 'Primary',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    },
    {
      full_name: 'shopper_spend_features',
      id: '55bd1af4',
      name: 'Shopper Spend Features',
      tags: [
        'data_science',
        'model_training',
        'model_explanation',
        'feature_engineering',
        'data_engineering'
      ],
      layer: 'Feature',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'shopper_churn_features',
      id: '442c2c34',
      name: 'Shopper Churn Features',
      tags: [
        'data_science',
        'model_training',
        'model_explanation',
        'feature_engineering',
        'data_engineering'
      ],
      layer: 'Feature',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'vendor_main',
      id: '181c2b7c',
      name: 'Vendor Main',
      tags: ['feature_engineering', 'data_engineering'],
      layer: 'Raw',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'salesforce_crm',
      id: '057ade39',
      name: 'Salesforce CRM',
      tags: ['feature_engineering', 'data_engineering'],
      layer: 'Raw',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'vendor_predictions',
      id: '7eb64be0',
      name: 'Vendor Predictions',
      tags: [
        'feature_engineering',
        'data_engineering',
        'data_science',
        'model_training'
      ],
      layer: 'Primary',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'salesforce_accounts',
      id: '42e79d42',
      name: 'Salesforce Accounts',
      tags: ['feature_engineering', 'data_engineering'],
      layer: 'Raw',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'params:_sales_model',
      id: '1b3afcba',
      name: 'params: Sales Model',
      tags: ['data_science', 'model_training'],
      layer: 'Model Input',
      pipelines: ['__default__', 'de'],
      type: 'parameters'
    },
    {
      full_name: 'sales_validation_results',
      id: '8770a38e',
      name: 'Sales Validation Results',
      tags: ['model_performance_monitoring', 'data_science', 'model_training'],
      layer: 'Model Output',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'sales_trained_model',
      id: '1dafa5fb',
      name: 'Sales Trained Model',
      tags: ['model_explanation', 'data_science', 'model_training'],
      layer: 'Model Input',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'params:_engagement_model',
      id: '3a60b3a4',
      name: 'params: Engagement Model',
      tags: ['data_science', 'model_training'],
      layer: 'Model Input',
      pipelines: ['__default__', 'de'],
      type: 'parameters'
    },
    {
      full_name: 'engagement_validation_results',
      id: 'fb4f64bd',
      name: 'Engagement Validation Results',
      tags: ['model_performance_monitoring', 'data_science', 'model_training'],
      layer: 'Model Output',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'engagement_trained_model',
      id: 'f4f3a276',
      name: 'Engagement Trained Model',
      tags: ['model_explanation', 'data_science', 'model_training'],
      layer: 'Models',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'sales_model_explanations',
      id: '792a14f6',
      name: 'Sales Model Explanations',
      tags: [
        'model_explanation',
        'data_science',
        'model_performance_monitoring',
        'reporting'
      ],
      layer: 'Model Output',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'engagement_model_explanations',
      id: '9bd2dc3d',
      name: 'Engagement Model Explanations',
      tags: [
        'model_explanation',
        'data_science',
        'model_performance_monitoring',
        'reporting'
      ],
      layer: 'Model Output',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'params:_optimisation',
      id: 'dff067eb',
      name: 'params: Optimisation',
      tags: ['data_science', 'model_training', 'optimisation'],
      layer: 'Model Input',
      pipelines: ['__default__', 'de'],
      type: 'parameters'
    },
    {
      full_name: 'digital_analysis',
      id: '92f58611',
      name: 'Digital Analysis',
      tags: ['data_science', 'model_training', 'optimisation'],
      layer: 'Model Input',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'engagement_recommendations',
      id: 'b2a3a8e5',
      name: 'Engagement Recommendations',
      tags: ['data_science', 'model_training'],
      layer: 'Model Output',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'action_cost_table',
      id: '9aeb6881',
      name: 'Action Cost Table',
      tags: ['data_science', 'optimisation'],
      layer: 'Raw',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'multi-channel_resolutions',
      id: '90713d4f',
      name: 'Multi-Channel Resolutions',
      tags: ['reporting', 'data_science', 'optimisation'],
      layer: 'Model Output',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'content_resolutions',
      id: '4704ff18',
      name: 'Content Resolutions',
      tags: ['reporting', 'data_science', 'optimisation'],
      layer: 'Model Output',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'segment_journeys_allocations',
      id: 'ccd3d45b',
      name: 'Segment Journeys Allocations',
      tags: ['reporting', 'data_science', 'optimisation'],
      layer: 'Model Output',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'upselling_readiness_dashboard_input',
      id: '3e3b263a',
      name: 'Upselling Readiness Dashboard Input',
      tags: ['reporting', 'data_science'],
      layer: 'Reporting',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'lead_scoring_dashboard_input',
      id: 'f3e15708',
      name: 'Lead Scoring Dashboard Input',
      tags: ['reporting', 'data_science'],
      layer: 'Reporting',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'lifetime_value_prediction_dashboard_input',
      id: '83ebce11',
      name: 'Lifetime Value Prediction Dashboard Input',
      tags: ['reporting', 'data_science'],
      layer: 'Reporting',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'digital_sales_dashboard_input',
      id: 'a72d7024',
      name: 'Digital Sales Dashboard Input',
      tags: ['reporting', 'data_science'],
      layer: 'Reporting',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      full_name: 'vendor_sales_dashboard_input',
      id: '8dbed427',
      name: 'Vendor Sales Dashboard Input',
      tags: ['reporting', 'data_science'],
      layer: 'Reporting',
      pipelines: ['__default__', 'de'],
      type: 'data'
    }
  ],
  tags: [
    {
      id: 'model_performance_monitoring',
      name: 'Model Performance Monitoring'
    },
    {
      id: 'data_science',
      name: 'Data Science'
    },
    {
      id: 'reporting',
      name: 'Reporting'
    },
    {
      id: 'model_training',
      name: 'Model Training'
    },
    {
      id: 'preprocessing',
      name: 'Preprocessing'
    },
    {
      id: 'optimisation',
      name: 'Optimisation'
    },
    {
      id: 'model_explanation',
      name: 'Model Explanation'
    },
    {
      id: 'feature_engineering',
      name: 'Feature Engineering'
    },
    {
      id: 'data_engineering',
      name: 'Data Engineering'
    }
  ]
};
