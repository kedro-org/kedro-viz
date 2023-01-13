import { shortTypeMapping } from '../config';

const getShortType = (name, fallback) => {
  const longTypeName = name?.split('.').slice(-3).join('.');
  return shortTypeMapping[longTypeName] || fallback;
};

export default getShortType;
