/* eslint-disable import/no-webpack-loader-syntax */
import graphWorker from 'workerize-loader?inline!./graph';

// This file contains any web-workers used in the app,
// which are inlined by webpack + workerize-loader, so that
// they can be used in the exported library without needing
// any special configuration on the part of the consumer

export const graph = graphWorker;
