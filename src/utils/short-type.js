import { shortTypeMapping } from '../config';

const getShortType = (longTypeName, fallback) => {
  return shortTypeMapping[longTypeName] || fallback;
};

export default getShortType;
