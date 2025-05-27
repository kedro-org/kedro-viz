// Utility to get fill color based on node and dataset status
export function getStatusFillColor(nodeStatus, datasetStatus) {
  if (nodeStatus === 'Failed' || datasetStatus === 'Missing') {
    return '#ff4d4d';
  } else if (nodeStatus === 'Success' || datasetStatus === 'Available') {
    return '#FFF';
  } else {
    return '#525252';
  }
}

export function getValueFillColor(nodeStatus, datasetStatus) {
    if (nodeStatus || datasetStatus) {
        return '#FFF';
    } else {
        return '#525252'
    }
 }