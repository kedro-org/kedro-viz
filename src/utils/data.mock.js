export default {
  snapshots: [
    {
      created_ts: '1551452832000',
      schema_id: '310750827599783',
      message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      tags: [
        {
          id: 'Nulla',
          name: 'Nulla'
        },
        {
          id: 'pulvinar',
          name: 'pulvinar'
        },
        {
          id: 'volutpat',
          name: 'volutpat'
        },
        {
          id: 'enim',
          name: 'enim'
        },
        {
          id: 'consectetur',
          name: 'consectetur'
        }
      ],
      edges: [
        {
          target: 'task/consectetur',
          source: 'data/Lorem'
        },
        {
          target: 'task/consectetur',
          source: 'data/ipsum'
        },
        {
          target: 'task/consectetur',
          source: 'data/dolor'
        },
        {
          target: 'task/consectetur',
          source: 'data/sit'
        },
        {
          target: 'task/consectetur',
          source: 'data/amet'
        },
        {
          target: 'data/Aliquam',
          source: 'task/consectetur'
        },
        {
          target: 'data/eu',
          source: 'task/consectetur'
        },
        {
          target: 'data/accumsan',
          source: 'task/consectetur'
        },
        {
          target: 'data/mauris',
          source: 'task/consectetur'
        }
      ],
      nodes: [
        {
          tags: ['Nulla', 'pulvinar', 'enim', 'consectetur', 'volutpat'],
          id: 'task/consectetur',
          type: 'task',
          full_name: 'consectetur',
          name: 'consectetur'
        },
        {
          tags: ['Nulla', 'pulvinar', 'volutpat', 'enim', 'consectetur'],
          id: 'data/mauris',
          type: 'data',
          full_name: 'mauris',
          name: 'mauris'
        },
        {
          tags: ['Nulla', 'pulvinar', 'volutpat', 'enim', 'consectetur'],
          id: 'data/Lorem',
          type: 'data',
          full_name: 'Lorem',
          name: 'Lorem'
        },
        {
          tags: ['Nulla', 'pulvinar', 'volutpat', 'enim', 'consectetur'],
          id: 'data/dolor',
          type: 'data',
          full_name: 'dolor',
          name: 'dolor'
        },
        {
          tags: ['Nulla', 'pulvinar', 'volutpat', 'enim', 'consectetur'],
          id: 'data/eu',
          type: 'data',
          full_name: 'eu',
          name: 'eu'
        },
        {
          tags: ['Nulla', 'pulvinar', 'volutpat', 'enim', 'consectetur'],
          id: 'data/accumsan',
          type: 'data',
          full_name: 'accumsan',
          name: 'accumsan'
        },
        {
          tags: ['Nulla', 'pulvinar', 'volutpat', 'enim', 'consectetur'],
          id: 'data/ipsum',
          type: 'data',
          full_name: 'ipsum',
          name: 'ipsum'
        },
        {
          tags: ['Nulla', 'pulvinar', 'volutpat', 'enim', 'consectetur'],
          id: 'data/sit',
          type: 'data',
          full_name: 'sit',
          name: 'sit'
        },
        {
          tags: ['Nulla', 'pulvinar', 'volutpat', 'enim', 'consectetur'],
          id: 'data/Aliquam',
          type: 'data',
          full_name: 'Aliquam',
          name: 'Aliquam'
        },
        {
          tags: ['Nulla', 'pulvinar', 'volutpat', 'enim', 'consectetur'],
          id: 'data/amet',
          type: 'data',
          full_name: 'amet',
          name: 'amet'
        }
      ]
    },
    {
      created_ts: '9999999999999',
      schema_id: '123456789012345',
      message: 'List of animal names',
      tags: [
        {
          id: 'small',
          name: 'small'
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
          tags: ['huge', 'small'],
          type: 'task'
        },
        {
          id: 'task/shark',
          name: 'shark',
          full_name: 'shark',
          tags: [],
          type: 'task'
        },
        {
          id: 'task/trout',
          name: 'trout',
          full_name: 'trout',
          tags: [],
          type: 'task'
        },
        {
          id: 'data/whale',
          name: 'whale',
          full_name: 'whale',
          tags: [],
          type: 'data'
        },
        {
          id: 'data/dog',
          name: 'dog',
          full_name: 'dog',
          tags: ['small', 'huge'],
          type: 'data'
        },
        {
          id: 'data/cat',
          name: 'cat',
          full_name: 'cat',
          tags: ['small', 'huge'],
          type: 'data'
        },
        {
          id: 'data/parameters_rabbit',
          name: 'parameters_rabbit',
          full_name: 'parameters_rabbit',
          tags: ['small', 'huge'],
          type: 'data'
        },
        {
          id: 'data/parameters',
          name: 'parameters',
          full_name: 'parameters',
          tags: ['small', 'huge'],
          type: 'data'
        },
        {
          id: 'data/sheep',
          name: 'sheep',
          full_name: 'sheep',
          tags: ['small', 'huge'],
          type: 'data'
        },
        {
          id: 'data/horse',
          name: 'horse',
          full_name: 'horse',
          tags: ['small', 'huge'],
          type: 'data'
        },
        {
          id: 'data/weasel',
          name: 'weasel',
          full_name: 'weasel',
          tags: [],
          type: 'data'
        },
        {
          id: 'data/elephant',
          name: 'elephant',
          full_name: 'elephant',
          tags: [],
          type: 'data'
        },
        {
          id: 'data/bear',
          name: 'bear',
          full_name: 'bear',
          tags: [],
          type: 'data'
        },
        {
          id: 'data/giraffe',
          name: 'giraffe',
          full_name: 'giraffe',
          tags: [],
          type: 'data'
        },
        {
          id: 'data/pig',
          name: 'pig',
          full_name: 'pig',
          tags: ['small', 'huge'],
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
    }
  ]
};
