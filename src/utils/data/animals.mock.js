export default {
  schema_id: '09876543210987654321',
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
    'Model Output'
  ],
  tags: [
    {
      id: 'small',
      name: 'small'
    },
    {
      id: 'medium',
      name: 'medium'
    },
    {
      id: 'huge',
      name: 'huge'
    }
  ],
  nodes: [
    {
      id: 'task/salmon',
      name: 'salmon',
      full_name: 'salmon',
      tags: ['small'],
      layer: 'Intermediate',
      pipelines: ['__default__', 'de'],
      type: 'task'
    },
    {
      id: 'task/shark',
      name: 'shark',
      full_name: 'shark',
      tags: ['medium', 'huge'],
      layer: 'Intermediate',
      pipelines: ['__default__', 'de'],
      type: 'task'
    },
    {
      id: 'task/trout',
      name: 'trout',
      full_name: 'trout',
      tags: ['small'],
      layer: 'Model Input',
      pipelines: ['__default__', 'ds'],
      type: 'task'
    },
    {
      id: 'data/whale',
      name: 'whale',
      full_name: 'whale',
      tags: ['huge'],
      layer: 'Model Output',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    },
    {
      id: 'data/dog',
      name: 'dog',
      full_name: 'dog',
      tags: ['small', 'medium'],
      layer: 'Raw',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      id: 'data/cat',
      name: 'cat',
      full_name: 'cat',
      tags: ['small', 'medium', 'huge'],
      layer: 'Raw',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      id: 'data/parameters_rabbit',
      name: 'parameters_rabbit',
      full_name: 'parameters_rabbit',
      tags: ['small'],
      layer: 'Intermediate',
      pipelines: ['__default__', 'de'],
      type: 'parameters'
    },
    {
      id: 'data/parameters',
      name: 'parameters',
      full_name: 'parameters',
      tags: [],
      layer: 'Intermediate',
      pipelines: ['__default__', 'de'],
      type: 'parameters'
    },
    {
      id: 'data/sheep',
      name: 'sheep',
      full_name: 'sheep',
      tags: ['medium'],
      layer: 'Primary',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      id: 'data/horse',
      name: 'horse',
      full_name: 'horse',
      tags: ['huge'],
      layer: 'Model Output',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      id: 'data/weasel',
      name: 'weasel',
      full_name: 'weasel',
      tags: ['small'],
      layer: 'Raw',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      id: 'data/elephant',
      name: 'elephant',
      full_name: 'elephant',
      tags: ['huge'],
      layer: 'Raw',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      id: 'data/bear',
      name: 'bear',
      full_name: 'bear',
      tags: ['huge'],
      layer: 'Raw',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      id: 'data/giraffe',
      name: 'giraffe',
      full_name: 'giraffe',
      tags: ['huge'],
      layer: 'Model Output',
      pipelines: ['__default__', 'de'],
      type: 'data'
    },
    {
      id: 'data/pig',
      name: 'pig',
      full_name: 'pig',
      tags: ['medium'],
      layer: 'Feature',
      pipelines: ['__default__', 'ds'],
      type: 'data'
    }
  ],
  edges: [
    {
      target: 'task/salmon',
      source: 'data/cat'
    },
    {
      target: 'task/salmon',
      source: 'data/dog'
    },
    {
      target: 'task/salmon',
      source: 'data/parameters'
    },
    {
      target: 'task/salmon',
      source: 'data/parameters_rabbit'
    },
    {
      target: 'data/pig',
      source: 'task/salmon'
    },
    {
      target: 'data/horse',
      source: 'task/salmon'
    },
    {
      target: 'data/sheep',
      source: 'task/salmon'
    },
    {
      target: 'task/shark',
      source: 'data/cat'
    },
    {
      target: 'task/shark',
      source: 'data/weasel'
    },
    {
      target: 'task/shark',
      source: 'data/elephant'
    },
    {
      target: 'task/shark',
      source: 'data/bear'
    },
    {
      target: 'data/sheep',
      source: 'task/shark'
    },
    {
      target: 'data/pig',
      source: 'task/shark'
    },
    {
      target: 'data/giraffe',
      source: 'task/shark'
    },
    {
      target: 'task/trout',
      source: 'data/pig'
    },
    {
      target: 'data/whale',
      source: 'task/trout'
    }
  ]
};
