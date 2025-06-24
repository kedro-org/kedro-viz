import React from 'react';
import App from '../app';
import getPipelineData from '../../utils/data-source';
import './container.scss';
import runData from './run-data.json';
// import { funNodeError } from '../../utils/run-status-mock-data/fun-node-error';

/**
 * Top-level component for the use-case where Kedro-Viz is run as a standalone
 * app rather than imported as a library/package into a larger application.
 */
const Container = () => (
  <>
    <App data={getPipelineData()} runData={runData} />
  </>
);

export default Container;
