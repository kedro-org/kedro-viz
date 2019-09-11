export default {
  edges: [
    {
      source: 'data/Interaction Raw',
      target: 'task/Load Raw Interaction Data'
    },
    {
      source: 'task/Load Raw Interaction Data',
      target: 'data/Interaction Primary'
    },
    {
      source: 'data/Country Raw',
      target: 'task/Load Raw Country Data'
    },
    {
      source: 'task/Load Raw Country Data',
      target: 'data/Country Primary'
    },
    {
      source: 'data/Shopper Spend Raw',
      target: 'task/Load Raw Shopper Spend Data'
    },
    {
      source: 'task/Load Raw Shopper Spend Data',
      target: 'data/Shopper Spend Primary'
    },
    {
      source: 'data/Interaction Primary',
      target: 'task/Preprocess Primary Interaction Data'
    },
    {
      source: 'task/Preprocess Primary Interaction Data',
      target: 'data/Interaction Intermediate'
    },
    {
      source: 'data/Country Primary',
      target: 'task/Preprocess Primary Country Data'
    },
    {
      source: 'task/Preprocess Primary Country Data',
      target: 'data/Country Intermediate'
    },
    {
      source: 'data/Shopper Spend Primary',
      target: 'task/Preprocess Primary Shopper Spend Data'
    },
    {
      source: 'task/Preprocess Primary Shopper Spend Data',
      target: 'data/Shopper Spend Intermediate'
    },
    {
      source: 'data/CRM Predictions',
      target: 'task/Create Shopper Spend Features'
    },
    {
      source: 'data/Interaction Intermediate',
      target: 'task/Create Shopper Spend Features'
    },
    {
      source: 'data/Country Intermediate',
      target: 'task/Create Shopper Spend Features'
    },
    {
      source: 'data/Shopper Spend Intermediate',
      target: 'task/Create Shopper Spend Features'
    },
    {
      source: 'task/Create Shopper Spend Features',
      target: 'data/Shopper Spend Features'
    },
    {
      source: 'data/CRM Predictions',
      target: 'task/Create Shopper Churn Features'
    },
    {
      source: 'data/Interaction Intermediate',
      target: 'task/Create Shopper Churn Features'
    },
    {
      source: 'data/Country Intermediate',
      target: 'task/Create Shopper Churn Features'
    },
    {
      source: 'data/Shopper Spend Intermediate',
      target: 'task/Create Shopper Churn Features'
    },
    {
      source: 'task/Create Shopper Churn Features',
      target: 'data/Shopper Churn Features'
    },
    {
      source: 'data/Vendor Master',
      target: 'task/Prepare Vendor Input'
    },
    {
      source: 'data/Salesforce CRM',
      target: 'task/Prepare Vendor Input'
    },
    {
      source: 'task/Prepare Vendor Input',
      target: 'data/Vendor Predictions'
    },
    {
      source: 'data/Vendor Master',
      target: 'task/Prepare CRM Input'
    },
    {
      source: 'data/Salesforce Accounts',
      target: 'task/Prepare CRM Input'
    },
    {
      source: 'task/Prepare CRM Input',
      target: 'data/CRM Predictions'
    },
    {
      source: 'data/Vendor Predictions',
      target: 'task/Predictive Sales Model'
    },
    {
      source: 'data/params: Sales Model',
      target: 'task/Predictive Sales Model'
    },
    {
      source: 'data/Shopper Spend Features',
      target: 'task/Predictive Sales Model'
    },
    {
      source: 'task/Predictive Sales Model',
      target: 'data/Sales Validation Results'
    },
    {
      source: 'task/Predictive Sales Model',
      target: 'data/Sales Trained Model'
    },
    {
      source: 'data/Shopper Churn Features',
      target: 'task/Predictive Engagement Model'
    },
    {
      source: 'data/params: Engagement Model',
      target: 'task/Predictive Engagement Model'
    },
    {
      source: 'task/Predictive Engagement Model',
      target: 'data/Engagement Validation Results'
    },
    {
      source: 'task/Predictive Engagement Model',
      target: 'data/Engagement Trained Model'
    },
    {
      source: 'data/Sales Trained Model',
      target: 'task/Sales Model Explainable AI'
    },
    {
      source: 'data/Shopper Spend Features',
      target: 'task/Sales Model Explainable AI'
    },
    {
      source: 'task/Sales Model Explainable AI',
      target: 'data/Sales Model Explanations'
    },
    {
      source: 'data/Engagement Trained Model',
      target: 'task/Engagement Model Explainable AI'
    },
    {
      source: 'data/Shopper Churn Features',
      target: 'task/Engagement Model Explainable AI'
    },
    {
      source: 'task/Engagement Model Explainable AI',
      target: 'data/Engagement Model Explanations'
    },
    {
      source: 'data/Sales Trained Model',
      target: 'task/Perform Digital Analysis'
    },
    {
      source: 'data/params: Optimisation',
      target: 'task/Perform Digital Analysis'
    },
    {
      source: 'data/Shopper Spend Features',
      target: 'task/Perform Digital Analysis'
    },
    {
      source: 'task/Perform Digital Analysis',
      target: 'data/Digital Analysis'
    },
    {
      source: 'data/params: Optimisation',
      target: 'task/Engagement Recommendation Engine'
    },
    {
      source: 'data/Engagement Trained Model',
      target: 'task/Engagement Recommendation Engine'
    },
    {
      source: 'data/Shopper Churn Features',
      target: 'task/Engagement Recommendation Engine'
    },
    {
      source: 'task/Engagement Recommendation Engine',
      target: 'data/Engagement Recommendations'
    },
    {
      source: 'data/Sales Model Explanations',
      target: 'task/Sales Model Performance Monitoring'
    },
    {
      source: 'data/Sales Validation Results',
      target: 'task/Sales Model Performance Monitoring'
    },
    {
      source: 'data/Engagement Validation Results',
      target: 'task/Engagement Model Performance Monitoring'
    },
    {
      source: 'data/Engagement Model Explanations',
      target: 'task/Engagement Model Performance Monitoring'
    },
    {
      source: 'data/params: Optimisation',
      target: 'task/Multi-Channel Optimisation'
    },
    {
      source: 'data/Action Cost Table',
      target: 'task/Multi-Channel Optimisation'
    },
    {
      source: 'data/Digital Analysis',
      target: 'task/Multi-Channel Optimisation'
    },
    {
      source: 'task/Multi-Channel Optimisation',
      target: 'data/Multi-Channel Resolutions'
    },
    {
      source: 'data/params: Optimisation',
      target: 'task/Content Optimisation'
    },
    {
      source: 'data/Digital Analysis',
      target: 'task/Content Optimisation'
    },
    {
      source: 'task/Content Optimisation',
      target: 'data/Content Resolutions'
    },
    {
      source: 'data/params: Optimisation',
      target: 'task/Segment Journeys'
    },
    {
      source: 'data/Content Resolutions',
      target: 'task/Segment Journeys'
    },
    {
      source: 'task/Segment Journeys',
      target: 'data/Segment Journeys Allocations'
    },
    {
      source: 'data/Multi-Channel Resolutions',
      target: 'task/Generate Dashboard Inputs'
    },
    {
      source: 'data/Segment Journeys Allocations',
      target: 'task/Generate Dashboard Inputs'
    },
    {
      source: 'data/Engagement Model Explanations',
      target: 'task/Generate Dashboard Inputs'
    },
    {
      source: 'data/Sales Model Explanations',
      target: 'task/Generate Dashboard Inputs'
    },
    {
      source: 'data/Content Resolutions',
      target: 'task/Generate Dashboard Inputs'
    },
    {
      source: 'task/Generate Dashboard Inputs',
      target: 'data/Upselling Readiness Dashboard Input'
    },
    {
      source: 'task/Generate Dashboard Inputs',
      target: 'data/Lead Scoring Dashboard Input'
    },
    {
      source: 'task/Generate Dashboard Inputs',
      target: 'data/Lifetime Value Prediction Dashboard Input'
    },
    {
      source: 'task/Generate Dashboard Inputs',
      target: 'data/Digital Sales Dashboard Input'
    },
    {
      source: 'task/Generate Dashboard Inputs',
      target: 'data/Vendor Sales Dashboard Input'
    }
  ],
  nodes: [
    {
      full_name: 'Load Raw Interaction Data',
      id: 'task/Load Raw Interaction Data',
      name: 'Load Raw Interaction Data',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'task'
    },
    {
      full_name: 'Load Raw Country Data',
      id: 'task/Load Raw Country Data',
      name: 'Load Raw Country Data',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'task'
    },
    {
      full_name: 'Load Raw Shopper Spend Data',
      id: 'task/Load Raw Shopper Spend Data',
      name: 'Load Raw Shopper Spend Data',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'task'
    },
    {
      full_name: 'Preprocess Primary Interaction Data',
      id: 'task/Preprocess Primary Interaction Data',
      name: 'Preprocess Primary Interaction Data',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'task'
    },
    {
      full_name: 'Preprocess Primary Country Data',
      id: 'task/Preprocess Primary Country Data',
      name: 'Preprocess Primary Country Data',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'task'
    },
    {
      full_name: 'Preprocess Primary Shopper Spend Data',
      id: 'task/Preprocess Primary Shopper Spend Data',
      name: 'Preprocess Primary Shopper Spend Data',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'task'
    },
    {
      full_name: 'Create Shopper Spend Features',
      id: 'task/Create Shopper Spend Features',
      name: 'Create Shopper Spend Features',
      tags: ['Feature Engineering', 'Data Engineering'],
      type: 'task'
    },
    {
      full_name: 'Create Shopper Churn Features',
      id: 'task/Create Shopper Churn Features',
      name: 'Create Shopper Churn Features',
      tags: ['Feature Engineering', 'Data Engineering'],
      type: 'task'
    },
    {
      full_name: 'Prepare Vendor Input',
      id: 'task/Prepare Vendor Input',
      name: 'Prepare Vendor Input',
      tags: ['Feature Engineering', 'Data Engineering'],
      type: 'task'
    },
    {
      full_name: 'Prepare CRM Input',
      id: 'task/Prepare CRM Input',
      name: 'Prepare CRM Input',
      tags: ['Feature Engineering', 'Data Engineering'],
      type: 'task'
    },
    {
      full_name: 'Predictive Sales Model',
      id: 'task/Predictive Sales Model',
      name: 'Predictive Sales Model',
      tags: ['Model Training', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Predictive Engagement Model',
      id: 'task/Predictive Engagement Model',
      name: 'Predictive Engagement Model',
      tags: ['Model Training', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Sales Model Explainable AI',
      id: 'task/Sales Model Explainable AI',
      name: 'Sales Model Explainable AI',
      tags: ['Model Explaination', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Engagement Model Explainable AI',
      id: 'task/Engagement Model Explainable AI',
      name: 'Engagement Model Explainable AI',
      tags: ['Model Explaination', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Perform Digital Analysis',
      id: 'task/Perform Digital Analysis',
      name: 'Perform Digital Analysis',
      tags: ['Model Training', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Engagement Recommendation Engine',
      id: 'task/Engagement Recommendation Engine',
      name: 'Engagement Recommendation Engine',
      tags: ['Model Training', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Sales Model Performance Monitoring',
      id: 'task/Sales Model Performance Monitoring',
      name: 'Sales Model Performance Monitoring',
      tags: ['Model Performance Monitoring', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Engagement Model Performance Monitoring',
      id: 'task/Engagement Model Performance Monitoring',
      name: 'Engagement Model Performance Monitoring',
      tags: ['Model Performance Monitoring', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Multi-Channel Optimisation',
      id: 'task/Multi-Channel Optimisation',
      name: 'Multi-Channel Optimisation',
      tags: ['Optimisation', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Content Optimisation',
      id: 'task/Content Optimisation',
      name: 'Content Optimisation',
      tags: ['Optimisation', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Segment Journeys',
      id: 'task/Segment Journeys',
      name: 'Segment Journeys',
      tags: ['Optimisation', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Generate Dashboard Inputs',
      id: 'task/Generate Dashboard Inputs',
      name: 'Generate Dashboard Inputs',
      tags: ['Reporting', 'Data Science'],
      type: 'task'
    },
    {
      full_name: 'Interaction Raw',
      id: 'data/Interaction Raw',
      is_parameters: false,
      name: 'Interaction Raw',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'data'
    },
    {
      full_name: 'Interaction Primary',
      id: 'data/Interaction Primary',
      is_parameters: false,
      name: 'Interaction Primary',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'data'
    },
    {
      full_name: 'Country Raw',
      id: 'data/Country Raw',
      is_parameters: false,
      name: 'Country Raw',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'data'
    },
    {
      full_name: 'Country Primary',
      id: 'data/Country Primary',
      is_parameters: false,
      name: 'Country Primary',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'data'
    },
    {
      full_name: 'Shopper Spend Raw',
      id: 'data/Shopper Spend Raw',
      is_parameters: false,
      name: 'Shopper Spend Raw',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'data'
    },
    {
      full_name: 'Shopper Spend Primary',
      id: 'data/Shopper Spend Primary',
      is_parameters: false,
      name: 'Shopper Spend Primary',
      tags: ['Data Engineering', 'Preprocessing'],
      type: 'data'
    },
    {
      full_name: 'Interaction Intermediate',
      id: 'data/Interaction Intermediate',
      is_parameters: false,
      name: 'Interaction Intermediate',
      tags: ['Feature Engineering', 'Data Engineering', 'Preprocessing'],
      type: 'data'
    },
    {
      full_name: 'Country Intermediate',
      id: 'data/Country Intermediate',
      is_parameters: false,
      name: 'Country Intermediate',
      tags: ['Feature Engineering', 'Data Engineering', 'Preprocessing'],
      type: 'data'
    },
    {
      full_name: 'Shopper Spend Intermediate',
      id: 'data/Shopper Spend Intermediate',
      is_parameters: false,
      name: 'Shopper Spend Intermediate',
      tags: ['Feature Engineering', 'Data Engineering', 'Preprocessing'],
      type: 'data'
    },
    {
      full_name: 'CRM Predictions',
      id: 'data/CRM Predictions',
      is_parameters: false,
      name: 'CRM Predictions',
      tags: ['Feature Engineering', 'Data Engineering'],
      type: 'data'
    },
    {
      full_name: 'Shopper Spend Features',
      id: 'data/Shopper Spend Features',
      is_parameters: false,
      name: 'Shopper Spend Features',
      tags: [
        'Model Explaination',
        'Data Science',
        'Data Engineering',
        'Model Training',
        'Feature Engineering'
      ],
      type: 'data'
    },
    {
      full_name: 'Shopper Churn Features',
      id: 'data/Shopper Churn Features',
      is_parameters: false,
      name: 'Shopper Churn Features',
      tags: [
        'Model Explaination',
        'Data Science',
        'Data Engineering',
        'Model Training',
        'Feature Engineering'
      ],
      type: 'data'
    },
    {
      full_name: 'Vendor Master',
      id: 'data/Vendor Master',
      is_parameters: false,
      name: 'Vendor Master',
      tags: ['Feature Engineering', 'Data Engineering'],
      type: 'data'
    },
    {
      full_name: 'Salesforce CRM',
      id: 'data/Salesforce CRM',
      is_parameters: false,
      name: 'Salesforce CRM',
      tags: ['Feature Engineering', 'Data Engineering'],
      type: 'data'
    },
    {
      full_name: 'Vendor Predictions',
      id: 'data/Vendor Predictions',
      is_parameters: false,
      name: 'Vendor Predictions',
      tags: [
        'Model Training',
        'Feature Engineering',
        'Data Science',
        'Data Engineering'
      ],
      type: 'data'
    },
    {
      full_name: 'Salesforce Accounts',
      id: 'data/Salesforce Accounts',
      is_parameters: false,
      name: 'Salesforce Accounts',
      tags: ['Feature Engineering', 'Data Engineering'],
      type: 'data'
    },
    {
      full_name: 'params: Sales Model',
      id: 'data/params: Sales Model',
      is_parameters: true,
      name: 'params: Sales Model',
      tags: ['Model Training', 'Data Science'],
      type: 'data'
    },
    {
      full_name: 'Sales Validation Results',
      id: 'data/Sales Validation Results',
      is_parameters: false,
      name: 'Sales Validation Results',
      tags: ['Model Training', 'Data Science', 'Model Performance Monitoring'],
      type: 'data'
    },
    {
      full_name: 'Sales Trained Model',
      id: 'data/Sales Trained Model',
      is_parameters: false,
      name: 'Sales Trained Model',
      tags: ['Model Training', 'Data Science', 'Model Explaination'],
      type: 'data'
    },
    {
      full_name: 'params: Engagement Model',
      id: 'data/params: Engagement Model',
      is_parameters: true,
      name: 'params: Engagement Model',
      tags: ['Model Training', 'Data Science'],
      type: 'data'
    },
    {
      full_name: 'Engagement Validation Results',
      id: 'data/Engagement Validation Results',
      is_parameters: false,
      name: 'Engagement Validation Results',
      tags: ['Model Training', 'Data Science', 'Model Performance Monitoring'],
      type: 'data'
    },
    {
      full_name: 'Engagement Trained Model',
      id: 'data/Engagement Trained Model',
      is_parameters: false,
      name: 'Engagement Trained Model',
      tags: ['Model Training', 'Data Science', 'Model Explaination'],
      type: 'data'
    },
    {
      full_name: 'Sales Model Explanations',
      id: 'data/Sales Model Explanations',
      is_parameters: false,
      name: 'Sales Model Explanations',
      tags: [
        'Reporting',
        'Model Performance Monitoring',
        'Data Science',
        'Model Explaination'
      ],
      type: 'data'
    },
    {
      full_name: 'Engagement Model Explanations',
      id: 'data/Engagement Model Explanations',
      is_parameters: false,
      name: 'Engagement Model Explanations',
      tags: [
        'Reporting',
        'Model Performance Monitoring',
        'Data Science',
        'Model Explaination'
      ],
      type: 'data'
    },
    {
      full_name: 'params: Optimisation',
      id: 'data/params: Optimisation',
      is_parameters: true,
      name: 'params: Optimisation',
      tags: ['Model Training', 'Data Science', 'Optimisation'],
      type: 'data'
    },
    {
      full_name: 'Digital Analysis',
      id: 'data/Digital Analysis',
      is_parameters: false,
      name: 'Digital Analysis',
      tags: ['Model Training', 'Data Science', 'Optimisation'],
      type: 'data'
    },
    {
      full_name: 'Engagement Recommendations',
      id: 'data/Engagement Recommendations',
      is_parameters: false,
      name: 'Engagement Recommendations',
      tags: ['Model Training', 'Data Science'],
      type: 'data'
    },
    {
      full_name: 'Action Cost Table',
      id: 'data/Action Cost Table',
      is_parameters: false,
      name: 'Action Cost Table',
      tags: ['Data Science', 'Optimisation'],
      type: 'data'
    },
    {
      full_name: 'Multi-Channel Resolutions',
      id: 'data/Multi-Channel Resolutions',
      is_parameters: false,
      name: 'Multi-Channel Resolutions',
      tags: ['Reporting', 'Data Science', 'Optimisation'],
      type: 'data'
    },
    {
      full_name: 'Content Resolutions',
      id: 'data/Content Resolutions',
      is_parameters: false,
      name: 'Content Resolutions',
      tags: ['Reporting', 'Data Science', 'Optimisation'],
      type: 'data'
    },
    {
      full_name: 'Segment Journeys Allocations',
      id: 'data/Segment Journeys Allocations',
      is_parameters: false,
      name: 'Segment Journeys Allocations',
      tags: ['Reporting', 'Data Science', 'Optimisation'],
      type: 'data'
    },
    {
      full_name: 'Upselling Readiness Dashboard Input',
      id: 'data/Upselling Readiness Dashboard Input',
      is_parameters: false,
      name: 'Upselling Readiness Dashboard Input',
      tags: ['Reporting', 'Data Science'],
      type: 'data'
    },
    {
      full_name: 'Lead Scoring Dashboard Input',
      id: 'data/Lead Scoring Dashboard Input',
      is_parameters: false,
      name: 'Lead Scoring Dashboard Input',
      tags: ['Reporting', 'Data Science'],
      type: 'data'
    },
    {
      full_name: 'Lifetime Value Prediction Dashboard Input',
      id: 'data/Lifetime Value Prediction Dashboard Input',
      is_parameters: false,
      name: 'Lifetime Value Prediction Dashboard Input',
      tags: ['Reporting', 'Data Science'],
      type: 'data'
    },
    {
      full_name: 'Digital Sales Dashboard Input',
      id: 'data/Digital Sales Dashboard Input',
      is_parameters: false,
      name: 'Digital Sales Dashboard Input',
      tags: ['Reporting', 'Data Science'],
      type: 'data'
    },
    {
      full_name: 'Vendor Sales Dashboard Input',
      id: 'data/Vendor Sales Dashboard Input',
      is_parameters: false,
      name: 'Vendor Sales Dashboard Input',
      tags: ['Reporting', 'Data Science'],
      type: 'data'
    }
  ],
  tags: [
    {
      id: 'Preprocessing',
      name: 'Preprocessing'
    },
    {
      id: 'Model Explaination',
      name: 'Model Explaination'
    },
    {
      id: 'Model Performance Monitoring',
      name: 'Model Performance Monitoring'
    },
    {
      id: 'Reporting',
      name: 'Reporting'
    },
    {
      id: 'Data Science',
      name: 'Data Science'
    },
    {
      id: 'Data Engineering',
      name: 'Data Engineering'
    },
    {
      id: 'Model Training',
      name: 'Model Training'
    },
    {
      id: 'Feature Engineering',
      name: 'Feature Engineering'
    },
    {
      id: 'Optimisation',
      name: 'Optimisation'
    }
  ]
};
