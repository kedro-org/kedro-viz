const NODE_COUNT = 40;

const getArray = n => Array.from(Array(n).keys());

const getRandom = range => range[Math.floor(Math.random() * range.length)];

const loremIpsum = 'lorem ipsum dolor sit amet consectetur adipiscing elit vestibulum id turpis nunc nulla vitae diam dignissim fermentum elit sit amet viverra libero quisque condimentum pellentesque convallis sed consequat neque ac rhoncus finibus'.split(
  ' '
);

const randomName = n =>
  getArray(n)
    .map(() => loremIpsum[getRandom(loremIpsum).length])
    .join('_');

const generateRandomData = () => {
  const layers = [
    'Raw',
    'Intermediate',
    'Primary',
    'Feature',
    'Model Input',
    'Model Output'
  ].map((name, id) => ({ id, name }));

  const nodes = getArray(NODE_COUNT).map((id, i, arr) => ({
    id,
    name: randomName(Math.ceil(Math.random() * 10)),
    layer: getRandom(layers)
  }));

  const links = nodes.map((d, i) => {
    const source = d;
    const targets = nodes.filter(
      dd => dd.id !== source.id && dd.layer.id > source.layer.id
    );
    if (targets.length) {
      return {
        source,
        target: getRandom(targets)
      };
    }
    return {
      target: source,
      source: getRandom(nodes)
    };
  });

  return {
    layers,
    nodes,
    links
  };
};

export default generateRandomData;
