import React, { useRef, useEffect, useCallback } from 'react';

import './circle-progress.bar.css';

const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 10;
const ALERT_THRESHOLD = 5;

const COLOR_CODES = {
  info: {
    color: 'green',
  },
  //   warning: {
  //     color: 'orange',
  //     threshold: WARNING_THRESHOLD,
  //   },
  //   alert: {
  //     color: 'red',
  //     threshold: ALERT_THRESHOLD,
  //   },
};

//   const stroke = circleRef?.current?.style.stroke;
//   const radius = circleRef?.current?.style.radius;
//   const normalizedRadius = radius - stroke * 2;
//   const circumference = normalizedRadius * 2 * Math.PI;

const width = 30;
const strokeWidth = 2;
const cRadius = width / 2;
const radius = cRadius - strokeWidth * 2;
// const circumference = radius * 2 * Math.PI;

const CircleProgressBar = ({ children: percent }) => {
  const circleRef = useRef(null);

  const TIME_LIMIT = 60;
  let timePassed = 0;
  let timeLeft = TIME_LIMIT;
  let timerInterval = null;
  let remainingPathColor = COLOR_CODES.info.color;

  const calculateTimeFraction = useCallback(() => {
    const rawTimeFraction = percent / TIME_LIMIT;
    return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
  }, [percent]);

  const setCircleDasharray = useCallback(() => {
    debugger;
    const circleDasharray = `${(
      calculateTimeFraction() * FULL_DASH_ARRAY
    ).toFixed(0)} 283`;
    document
      .getElementById('base-timer-path-remaining')
      .setAttribute('stroke-dasharray', circleDasharray);
  }, [calculateTimeFraction]);

  const startTimer = useCallback(() => {
    const timerInterval = setInterval(() => {
      let timePassed = (timePassed += 1);
      let timeLeft = TIME_LIMIT - timePassed;
      //   document.getElementById('base-timer-label').innerHTML =
      //     formatTime(timeLeft);

      setCircleDasharray();
    }, 1000);
  }, [setCircleDasharray]);

  useEffect(() => startTimer(), [startTimer]);

  return (
    // <div className="circle-wrap">
    //   <div className="circle">
    //     <div className="mask full">
    //       <div className="fill"></div>
    //     </div>
    //     <div className="mask half">
    //       <div className="fill"></div>
    //     </div>
    //     <div className="inside-circle"> {children} </div>
    //   </div>
    // </div>

    // <svg className="progress-ring" height={width} width={width}>
    //   <circle
    //     ref={circleRef}
    //     className="progress-ring__circle"
    //     stroke="white"
    //     strokeWidth="2"
    //     strokeDasharray={`${circumference} ${circumference}`}
    //     fill="transparent"
    //     r={radius}
    //     cx={cRadius}
    //     cy={cRadius}
    //     style={{
    //       strokeDashoffset: circumference,
    //     }}
    //   />
    //   <span>{percent}</span>
    // </svg>

    <div class="base-timer">
      <svg
        class="base-timer__svg"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g class="base-timer__circle">
          <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45" />
          <path
            id="base-timer-path-remaining"
            stroke-dasharray="283"
            className={`base-timer__path-remaining ${remainingPathColor}`}
            d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0
        "
          ></path>
        </g>
      </svg>
      <span id="base-timer-label" class="base-timer__label">
        {percent}
      </span>
    </div>
  );
};

export default CircleProgressBar;
