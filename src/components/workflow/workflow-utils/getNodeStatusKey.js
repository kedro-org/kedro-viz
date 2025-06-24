//To get the status key for a node from a status object, using a statusConfig order
export function getNodeStatusKey(statusObj, node, statusConfig) {
  if (!statusObj || !statusConfig) {
    return null;
  }
  const foundKey = statusConfig.find(
    (statusKey) => statusObj[statusKey] && statusObj[statusKey][node.id]
  );

  return foundKey || 'skipped';
}
