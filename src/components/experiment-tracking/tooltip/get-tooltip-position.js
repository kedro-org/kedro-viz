import { sidebarWidth } from '../../../config';

const tooltipMaxWidth = 300;
const tooltipLeftGap = 85;
const tooltipRightGap = 70;
const tooltipTopGap = 150;

export const getTooltipPosition = (e) => {
  const y = e.clientY - tooltipTopGap;
  let x, direction;

  if (window.innerWidth - e.clientX > tooltipMaxWidth) {
    x = e.clientX - sidebarWidth.open - tooltipRightGap;
    direction = 'right';
  } else {
    x = e.clientX - sidebarWidth.open - sidebarWidth.open / 2 - tooltipLeftGap;
    direction = 'left';
  }

  return { x, y, direction };
};
