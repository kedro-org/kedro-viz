export default {
  layers: [
    {
      id: 0,
      name: 'Raw'
    },
    {
      id: 1,
      name: 'Intermediate'
    },
    {
      id: 2,
      name: 'Primary'
    },
    {
      id: 3,
      name: 'Feature'
    },
    {
      id: 4,
      name: 'Model Input'
    },
    {
      id: 5,
      name: 'Model Output'
    }
  ],
  nodes: [
    {
      id: 'task/sed_viverra',
      name: 'sed viverra',
      full_name: 'sed viverra',
      type: 'task',
      layer: 1,
      tags: ['intermediate', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'task/neque_sit_ac_elit_neque',
      name: 'neque sit ac elit neque',
      full_name: 'neque sit ac elit neque',
      type: 'task',
      layer: 4,
      tags: [
        'model-input',
        'adipiscing_dolor',
        'pellentesque_ipsum_dolor_fermentum_pellentesque'
      ]
    },
    {
      id: 'task/finibus_amet_rhoncus_consectetur_vitae_libero_nulla',
      name: 'finibus amet rhoncus consectetur vitae libero nulla',
      full_name: 'finibus amet rhoncus consectetur vitae libero nulla',
      type: 'task',
      layer: 0,
      tags: ['raw', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'task/vestibulum_consectetur_id',
      name: 'vestibulum consectetur id',
      full_name: 'vestibulum consectetur id',
      type: 'task',
      layer: 3,
      tags: ['feature', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'task/vitae',
      name: 'vitae',
      full_name: 'vitae',
      type: 'task',
      layer: 2,
      tags: ['primary', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'task/nulla_consequat_dignissim_elit_adipiscing_ac',
      name: 'nulla consequat dignissim elit adipiscing ac',
      full_name: 'nulla consequat dignissim elit adipiscing ac',
      type: 'task',
      layer: 2,
      tags: ['primary', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'task/consequat',
      name: 'consequat',
      full_name: 'consequat',
      type: 'task',
      layer: 2,
      tags: [
        'primary',
        'pellentesque_ipsum_dolor_fermentum_pellentesque',
        'adipiscing_dolor'
      ]
    },
    {
      id:
        'task/finibus_neque_sit_fermentum_adipiscing_dignissim_viverra_pellentesque_quisque_ipsum',
      name:
        'finibus neque sit fermentum adipiscing dignissim viverra pellentesque quisque ipsum',
      full_name:
        'finibus neque sit fermentum adipiscing dignissim viverra pellentesque quisque ipsum',
      type: 'task',
      layer: 1,
      tags: [
        'intermediate',
        'pellentesque_ipsum_dolor_fermentum_pellentesque',
        'adipiscing_dolor'
      ]
    },
    {
      id: 'task/pellentesque_amet_adipiscing_ac_libero_id_consectetur',
      name: 'pellentesque amet adipiscing ac libero id consectetur',
      full_name: 'pellentesque amet adipiscing ac libero id consectetur',
      type: 'task',
      layer: 2,
      tags: ['primary', 'adipiscing_dolor']
    },
    {
      id: 'task/sit_pellentesque_amet_lorem',
      name: 'sit pellentesque amet lorem',
      full_name: 'sit pellentesque amet lorem',
      type: 'task',
      layer: 1,
      tags: [
        'intermediate',
        'pellentesque_ipsum_dolor_fermentum_pellentesque',
        'adipiscing_dolor'
      ]
    },
    {
      id: 'data/diam_nulla_finibus_dignissim_viverra_viverra',
      name: 'diam nulla finibus dignissim viverra viverra',
      full_name: 'diam nulla finibus dignissim viverra viverra',
      type: 'data',
      layer: 0,
      tags: ['raw', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'data/neque_amet_turpis_rhoncus_dolor_nunc_sit',
      name: 'neque amet turpis rhoncus dolor nunc sit',
      full_name: 'neque amet turpis rhoncus dolor nunc sit',
      type: 'data',
      layer: 4,
      tags: ['model-input', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'data/elit_adipiscing_fermentum_nunc_amet_consectetur_adipiscing',
      name: 'elit adipiscing fermentum nunc amet consectetur adipiscing',
      full_name: 'elit adipiscing fermentum nunc amet consectetur adipiscing',
      type: 'data',
      layer: 0,
      tags: [
        'raw',
        'adipiscing_dolor',
        'pellentesque_ipsum_dolor_fermentum_pellentesque'
      ]
    },
    {
      id: 'data/parameters_convallis_amet_fermentum_sit_nulla_id_ac_diam',
      name: 'parameters convallis amet fermentum sit nulla id ac diam',
      full_name: 'parameters convallis amet fermentum sit nulla id ac diam',
      type: 'parameters',
      layer: 1,
      tags: ['intermediate', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'data/condimentum_viverra_rhoncus_sit_amet_neque_diam_consequat',
      name: 'condimentum viverra rhoncus sit amet neque diam consequat',
      full_name: 'condimentum viverra rhoncus sit amet neque diam consequat',
      type: 'data',
      layer: 1,
      tags: ['intermediate', 'adipiscing_dolor']
    },
    {
      id: 'data/parameters_libero',
      name: 'parameters libero',
      full_name: 'parameters libero',
      type: 'parameters',
      layer: 4,
      tags: ['model-input', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'data/amet_fermentum_fermentum_amet_sed',
      name: 'amet fermentum fermentum amet sed',
      full_name: 'amet fermentum fermentum amet sed',
      type: 'data',
      layer: 0,
      tags: [
        'raw',
        'adipiscing_dolor',
        'pellentesque_ipsum_dolor_fermentum_pellentesque'
      ]
    },
    {
      id: 'data/parameters_nulla_rhoncus',
      name: 'parameters nulla rhoncus',
      full_name: 'parameters nulla rhoncus',
      type: 'parameters',
      layer: 0,
      tags: [
        'raw',
        'adipiscing_dolor',
        'pellentesque_ipsum_dolor_fermentum_pellentesque'
      ]
    },
    {
      id: 'data/diam',
      name: 'diam',
      full_name: 'diam',
      type: 'data',
      layer: 3,
      tags: [
        'feature',
        'adipiscing_dolor',
        'pellentesque_ipsum_dolor_fermentum_pellentesque'
      ]
    },
    {
      id: 'data/consectetur_libero_sit_diam_vestibulum_vitae',
      name: 'consectetur libero sit diam vestibulum vitae',
      full_name: 'consectetur libero sit diam vestibulum vitae',
      type: 'data',
      layer: 2,
      tags: ['primary', 'adipiscing_dolor']
    },
    {
      id:
        'data/amet_rhoncus_convallis_libero_fermentum_dignissim_amet_elit_rhoncus',
      name:
        'amet rhoncus convallis libero fermentum dignissim amet elit rhoncus',
      full_name:
        'amet rhoncus convallis libero fermentum dignissim amet elit rhoncus',
      type: 'data',
      layer: 3,
      tags: ['feature', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'data/neque_diam_convallis_amet_consequat',
      name: 'neque diam convallis amet consequat',
      full_name: 'neque diam convallis amet consequat',
      type: 'data',
      layer: 0,
      tags: [
        'raw',
        'adipiscing_dolor',
        'pellentesque_ipsum_dolor_fermentum_pellentesque'
      ]
    },
    {
      id: 'data/vestibulum_diam_nunc',
      name: 'vestibulum diam nunc',
      full_name: 'vestibulum diam nunc',
      type: 'data',
      layer: 1,
      tags: ['intermediate', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'data/nulla_adipiscing_ac_elit_lorem_finibus',
      name: 'nulla adipiscing ac elit lorem finibus',
      full_name: 'nulla adipiscing ac elit lorem finibus',
      type: 'data',
      layer: 0,
      tags: ['raw', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id:
        'data/parameters_viverra_rhoncus_rhoncus_condimentum_elit_fermentum_turpis_amet_quisque_sit',
      name:
        'parameters viverra rhoncus rhoncus condimentum elit fermentum turpis amet quisque sit',
      full_name:
        'parameters viverra rhoncus rhoncus condimentum elit fermentum turpis amet quisque sit',
      type: 'parameters',
      layer: 0,
      tags: [
        'raw',
        'adipiscing_dolor',
        'pellentesque_ipsum_dolor_fermentum_pellentesque'
      ]
    },
    {
      id: 'data/amet',
      name: 'amet',
      full_name: 'amet',
      type: 'data',
      layer: 1,
      tags: [
        'intermediate',
        'adipiscing_dolor',
        'pellentesque_ipsum_dolor_fermentum_pellentesque'
      ]
    },
    {
      id: 'data/sed_condimentum_diam_diam',
      name: 'sed condimentum diam diam',
      full_name: 'sed condimentum diam diam',
      type: 'data',
      layer: 4,
      tags: ['model-input', 'adipiscing_dolor']
    },
    {
      id:
        'data/amet_pellentesque_dolor_consequat_elit_convallis_fermentum_vitae_diam',
      name:
        'amet pellentesque dolor consequat elit convallis fermentum vitae diam',
      full_name:
        'amet pellentesque dolor consequat elit convallis fermentum vitae diam',
      type: 'data',
      layer: 0,
      tags: ['raw', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'data/quisque_fermentum_fermentum_diam_libero_nulla',
      name: 'quisque fermentum fermentum diam libero nulla',
      full_name: 'quisque fermentum fermentum diam libero nulla',
      type: 'data',
      layer: 2,
      tags: [
        'primary',
        'pellentesque_ipsum_dolor_fermentum_pellentesque',
        'adipiscing_dolor'
      ]
    },
    {
      id: 'data/libero_sit_libero_dignissim_consequat_vestibulum_neque',
      name: 'libero sit libero dignissim consequat vestibulum neque',
      full_name: 'libero sit libero dignissim consequat vestibulum neque',
      type: 'data',
      layer: 3,
      tags: ['feature', 'adipiscing_dolor']
    },
    {
      id: 'data/nunc_turpis',
      name: 'nunc turpis',
      full_name: 'nunc turpis',
      type: 'data',
      layer: 0,
      tags: ['raw', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'data/amet_nunc_libero_nulla_sit',
      name: 'amet nunc libero nulla sit',
      full_name: 'amet nunc libero nulla sit',
      type: 'data',
      layer: 5,
      tags: ['model-output', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id:
        'data/pellentesque_elit_neque_sed_pellentesque_condimentum_condimentum',
      name: 'pellentesque elit neque sed pellentesque condimentum condimentum',
      full_name:
        'pellentesque elit neque sed pellentesque condimentum condimentum',
      type: 'data',
      layer: 1,
      tags: ['intermediate', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'data/consequat_rhoncus_ac_ipsum_lorem_neque_vestibulum',
      name: 'consequat rhoncus ac ipsum lorem neque vestibulum',
      full_name: 'consequat rhoncus ac ipsum lorem neque vestibulum',
      type: 'data',
      layer: 1,
      tags: ['intermediate', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id:
        'data/vitae_libero_libero_lorem_elit_adipiscing_fermentum_fermentum_vestibulum_id',
      name:
        'vitae libero libero lorem elit adipiscing fermentum fermentum vestibulum id',
      full_name:
        'vitae libero libero lorem elit adipiscing fermentum fermentum vestibulum id',
      type: 'data',
      layer: 2,
      tags: ['primary', 'pellentesque_ipsum_dolor_fermentum_pellentesque']
    },
    {
      id: 'data/convallis_convallis',
      name: 'convallis convallis',
      full_name: 'convallis convallis',
      type: 'data',
      layer: 2,
      tags: [
        'primary',
        'adipiscing_dolor',
        'pellentesque_ipsum_dolor_fermentum_pellentesque'
      ]
    },
    {
      id: 'data/neque',
      name: 'neque',
      full_name: 'neque',
      type: 'data',
      layer: 1,
      tags: [
        'intermediate',
        'pellentesque_ipsum_dolor_fermentum_pellentesque',
        'adipiscing_dolor'
      ]
    },
    {
      id: 'data/convallis',
      name: 'convallis',
      full_name: 'convallis',
      type: 'data',
      layer: 1,
      tags: [
        'intermediate',
        'pellentesque_ipsum_dolor_fermentum_pellentesque',
        'adipiscing_dolor'
      ]
    }
  ],
  edges: [
    { source: 'task/sed_viverra', target: 'data/parameters_libero' },
    {
      source: 'task/sed_viverra',
      target: 'data/libero_sit_libero_dignissim_consequat_vestibulum_neque'
    },
    { source: 'task/sed_viverra', target: 'data/amet_nunc_libero_nulla_sit' },
    { source: 'task/sed_viverra', target: 'data/convallis_convallis' },
    {
      source:
        'data/amet_pellentesque_dolor_consequat_elit_convallis_fermentum_vitae_diam',
      target: 'task/sed_viverra'
    },
    {
      source: 'data/diam_nulla_finibus_dignissim_viverra_viverra',
      target: 'task/sed_viverra'
    },
    { source: 'data/nunc_turpis', target: 'task/sed_viverra' },
    { source: 'data/parameters_nulla_rhoncus', target: 'task/sed_viverra' },
    {
      source: 'data/consequat_rhoncus_ac_ipsum_lorem_neque_vestibulum',
      target: 'task/neque_sit_ac_elit_neque'
    },
    { source: 'data/convallis', target: 'task/neque_sit_ac_elit_neque' },
    {
      source: 'data/amet_fermentum_fermentum_amet_sed',
      target: 'task/neque_sit_ac_elit_neque'
    },
    {
      source: 'data/parameters_nulla_rhoncus',
      target: 'task/neque_sit_ac_elit_neque'
    },
    {
      source: 'task/finibus_amet_rhoncus_consectetur_vitae_libero_nulla',
      target: 'data/sed_condimentum_diam_diam'
    },
    {
      source: 'task/finibus_amet_rhoncus_consectetur_vitae_libero_nulla',
      target: 'data/consectetur_libero_sit_diam_vestibulum_vitae'
    },
    {
      source: 'task/finibus_amet_rhoncus_consectetur_vitae_libero_nulla',
      target: 'data/amet_nunc_libero_nulla_sit'
    },
    {
      source: 'task/finibus_amet_rhoncus_consectetur_vitae_libero_nulla',
      target: 'data/quisque_fermentum_fermentum_diam_libero_nulla'
    },
    {
      source: 'data/parameters_nulla_rhoncus',
      target: 'task/finibus_amet_rhoncus_consectetur_vitae_libero_nulla'
    },
    {
      source: 'data/elit_adipiscing_fermentum_nunc_amet_consectetur_adipiscing',
      target: 'task/finibus_amet_rhoncus_consectetur_vitae_libero_nulla'
    },
    {
      source: 'data/nulla_adipiscing_ac_elit_lorem_finibus',
      target: 'task/finibus_amet_rhoncus_consectetur_vitae_libero_nulla'
    },
    {
      source: 'task/vestibulum_consectetur_id',
      target: 'data/amet_nunc_libero_nulla_sit'
    },
    {
      source: 'task/vestibulum_consectetur_id',
      target: 'data/parameters_libero'
    },
    { source: 'data/neque', target: 'task/vestibulum_consectetur_id' },
    {
      source: 'data/nulla_adipiscing_ac_elit_lorem_finibus',
      target: 'task/vestibulum_consectetur_id'
    },
    {
      source: 'data/amet_fermentum_fermentum_amet_sed',
      target: 'task/vestibulum_consectetur_id'
    },
    {
      source: 'data/vestibulum_diam_nunc',
      target: 'task/vestibulum_consectetur_id'
    },
    {
      source: 'task/vitae',
      target:
        'data/amet_rhoncus_convallis_libero_fermentum_dignissim_amet_elit_rhoncus'
    },
    {
      source: 'task/vitae',
      target: 'data/consectetur_libero_sit_diam_vestibulum_vitae'
    },
    {
      source: 'task/vitae',
      target: 'data/libero_sit_libero_dignissim_consequat_vestibulum_neque'
    },
    {
      source: 'task/vitae',
      target:
        'data/vitae_libero_libero_lorem_elit_adipiscing_fermentum_fermentum_vestibulum_id'
    },
    {
      source: 'data/neque_diam_convallis_amet_consequat',
      target: 'task/vitae'
    },
    {
      source: 'data/nulla_adipiscing_ac_elit_lorem_finibus',
      target: 'task/vitae'
    },
    {
      source: 'data/parameters_convallis_amet_fermentum_sit_nulla_id_ac_diam',
      target: 'task/vitae'
    },
    {
      source: 'task/nulla_consequat_dignissim_elit_adipiscing_ac',
      target: 'data/libero_sit_libero_dignissim_consequat_vestibulum_neque'
    },
    {
      source: 'task/nulla_consequat_dignissim_elit_adipiscing_ac',
      target:
        'data/amet_rhoncus_convallis_libero_fermentum_dignissim_amet_elit_rhoncus'
    },
    {
      source: 'task/nulla_consequat_dignissim_elit_adipiscing_ac',
      target: 'data/neque_amet_turpis_rhoncus_dolor_nunc_sit'
    },
    {
      source: 'task/nulla_consequat_dignissim_elit_adipiscing_ac',
      target: 'data/amet_nunc_libero_nulla_sit'
    },
    {
      source: 'data/neque_diam_convallis_amet_consequat',
      target: 'task/nulla_consequat_dignissim_elit_adipiscing_ac'
    },
    {
      source:
        'data/parameters_viverra_rhoncus_rhoncus_condimentum_elit_fermentum_turpis_amet_quisque_sit',
      target: 'task/nulla_consequat_dignissim_elit_adipiscing_ac'
    },
    {
      source: 'data/vestibulum_diam_nunc',
      target: 'task/nulla_consequat_dignissim_elit_adipiscing_ac'
    },
    {
      source: 'data/diam_nulla_finibus_dignissim_viverra_viverra',
      target: 'task/nulla_consequat_dignissim_elit_adipiscing_ac'
    },
    { source: 'task/consequat', target: 'data/diam' },
    { source: 'task/consequat', target: 'data/convallis_convallis' },
    {
      source: 'task/consequat',
      target: 'data/libero_sit_libero_dignissim_consequat_vestibulum_neque'
    },
    {
      source: 'task/consequat',
      target:
        'data/amet_rhoncus_convallis_libero_fermentum_dignissim_amet_elit_rhoncus'
    },
    {
      source: 'data/elit_adipiscing_fermentum_nunc_amet_consectetur_adipiscing',
      target: 'task/consequat'
    },
    { source: 'data/convallis', target: 'task/consequat' },
    { source: 'data/neque', target: 'task/consequat' },
    {
      source: 'data/amet_fermentum_fermentum_amet_sed',
      target: 'task/consequat'
    },
    {
      source:
        'task/finibus_neque_sit_fermentum_adipiscing_dignissim_viverra_pellentesque_quisque_ipsum',
      target: 'data/quisque_fermentum_fermentum_diam_libero_nulla'
    },
    {
      source:
        'task/finibus_neque_sit_fermentum_adipiscing_dignissim_viverra_pellentesque_quisque_ipsum',
      target: 'data/sed_condimentum_diam_diam'
    },
    {
      source:
        'task/finibus_neque_sit_fermentum_adipiscing_dignissim_viverra_pellentesque_quisque_ipsum',
      target: 'data/neque_amet_turpis_rhoncus_dolor_nunc_sit'
    },
    {
      source:
        'task/finibus_neque_sit_fermentum_adipiscing_dignissim_viverra_pellentesque_quisque_ipsum',
      target: 'data/amet'
    },
    {
      source: 'data/elit_adipiscing_fermentum_nunc_amet_consectetur_adipiscing',
      target:
        'task/finibus_neque_sit_fermentum_adipiscing_dignissim_viverra_pellentesque_quisque_ipsum'
    },
    {
      source:
        'data/amet_pellentesque_dolor_consequat_elit_convallis_fermentum_vitae_diam',
      target:
        'task/finibus_neque_sit_fermentum_adipiscing_dignissim_viverra_pellentesque_quisque_ipsum'
    },
    {
      source:
        'data/parameters_viverra_rhoncus_rhoncus_condimentum_elit_fermentum_turpis_amet_quisque_sit',
      target:
        'task/finibus_neque_sit_fermentum_adipiscing_dignissim_viverra_pellentesque_quisque_ipsum'
    },
    {
      source: 'data/parameters_nulla_rhoncus',
      target:
        'task/finibus_neque_sit_fermentum_adipiscing_dignissim_viverra_pellentesque_quisque_ipsum'
    },
    {
      source: 'task/pellentesque_amet_adipiscing_ac_libero_id_consectetur',
      target: 'data/libero_sit_libero_dignissim_consequat_vestibulum_neque'
    },
    {
      source: 'task/pellentesque_amet_adipiscing_ac_libero_id_consectetur',
      target:
        'data/amet_rhoncus_convallis_libero_fermentum_dignissim_amet_elit_rhoncus'
    },
    {
      source: 'data/condimentum_viverra_rhoncus_sit_amet_neque_diam_consequat',
      target: 'task/pellentesque_amet_adipiscing_ac_libero_id_consectetur'
    },
    {
      source:
        'data/pellentesque_elit_neque_sed_pellentesque_condimentum_condimentum',
      target: 'task/pellentesque_amet_adipiscing_ac_libero_id_consectetur'
    },
    {
      source: 'data/quisque_fermentum_fermentum_diam_libero_nulla',
      target: 'task/pellentesque_amet_adipiscing_ac_libero_id_consectetur'
    },
    {
      source: 'data/consequat_rhoncus_ac_ipsum_lorem_neque_vestibulum',
      target: 'task/pellentesque_amet_adipiscing_ac_libero_id_consectetur'
    },
    {
      source: 'task/sit_pellentesque_amet_lorem',
      target:
        'data/amet_rhoncus_convallis_libero_fermentum_dignissim_amet_elit_rhoncus'
    },
    {
      source: 'task/sit_pellentesque_amet_lorem',
      target:
        'data/vitae_libero_libero_lorem_elit_adipiscing_fermentum_fermentum_vestibulum_id'
    },
    {
      source: 'task/sit_pellentesque_amet_lorem',
      target: 'data/convallis_convallis'
    },
    {
      source: 'task/sit_pellentesque_amet_lorem',
      target: 'data/neque_amet_turpis_rhoncus_dolor_nunc_sit'
    },
    {
      source:
        'data/parameters_viverra_rhoncus_rhoncus_condimentum_elit_fermentum_turpis_amet_quisque_sit',
      target: 'task/sit_pellentesque_amet_lorem'
    },
    {
      source: 'data/elit_adipiscing_fermentum_nunc_amet_consectetur_adipiscing',
      target: 'task/sit_pellentesque_amet_lorem'
    },
    {
      source:
        'data/pellentesque_elit_neque_sed_pellentesque_condimentum_condimentum',
      target: 'task/sit_pellentesque_amet_lorem'
    }
  ],
  tags: [
    {
      name: 'pellentesque_ipsum_dolor_fermentum_pellentesque',
      id: 'pellentesque_ipsum_dolor_fermentum_pellentesque'
    },
    { name: 'adipiscing_dolor', id: 'adipiscing_dolor' },
    { name: 'Raw', id: 'raw' },
    { name: 'Intermediate', id: 'intermediate' },
    { name: 'Primary', id: 'primary' },
    { name: 'Feature', id: 'feature' },
    { name: 'Model Input', id: 'model-input' },
    { name: 'Model Output', id: 'model-output' }
  ]
};
