// Mock remark-gfm plugin for Jest testing
const remarkGfm = () => {
  // Return a simple identity function for testing
  return (tree) => tree;
};

export default remarkGfm;
