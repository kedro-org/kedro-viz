# Architecture

This document describes the high-level architecture of Kedro-Viz. This would be a great starting point for you to get familiar with the codebase and our cross cutting concerns throughout the app. 

See also the contributing docs, which walks through our set of guidelines and recommended best practices for our codebase. 

# High-level Overview
<!-- Architecture diagram including how standalone app / library entrypoints connect -->

On a high-level, Kedro-viz is a web-app that accepts pipeline data as an input and produces a interactive visualization graph to represent an overview of the current state of the pipeline of the Kedro project. 

More specifically, kedro-viz consumes pipeline data in a specific object format that includes all pipelines, edges an nodes of the Kedro project, meanwhile the Kedro-viz API layer makes request to the Kedro project for further details of a node object, which will be requested and displayed on user clicking a node on the flowchart. (One important thing to note is the concept of a 'node' in Kedro-viz, which is different from the concept of 'node' in Kedro. A 'node' on Kedro-viz referes to an element for display on the flowchart, which could be either a 'database', 'parameter' or 'function' element.)

Kedro-viz is made up of two main parts: the front-end web-app UI that is built on React, and an API layer that pulls data from the Kedro project on which Kedro-viz is running on. 

Currently, the API has 2 endpoints: `/pipeline/<id>` and `/node/<id>`. Each endpoint is called via actions within the app. 

Kedro-viz can exist either as a standalone web-app (via spinning up the web-app from a bash command with data consumed from a running Kedro project), or as a react component that can be imported in any external web-app (consuming data from a JSON file instead of a running Kedro project).  

# Our tools
This section outlines the third party tools that we heavily utilize within Kedro-viz. 
### Redux
We use redux to manage our data flow and state manegement within our web-app, utilizing the redux-toolkit (https://redux-toolkit.js.org/) for all redux-related configuration. 

Upon firing an action to obtain the pipeline data (either from the `/pipeline` endpoint or via a JSON file), the pipeline data is further prepared and stored within the redux store as a single source of truth within the app. 

All data-fetching from the API and updates to the state within the app are strictly done via actions, while all data are consumed by components either directly through the state or selectors. 
### Web workers
Kedro-viz utilizes web workers to asynchronously perform time-consuming calculations (e.g. for instance the dagre/newgraph layout calculation for the flowchart) in a separate CPU thread, in order to prevent it from blocking other operations on the main thread (e.g. CSS transitions and other state updates).

The layout calculation as performed by the web-worker is masked by the spinning loader to improve the user experience in larger graphs.

### SCSS imports
Kedro-Viz utilizes SCSS imports to utilize and access mixins and variables in our stylesheets. 

### Jest & React testing library
All tests within Kedro-viz are set up with Jest, with some tests set up using React testing library to utilize their `fireEvent` function. 

# Codemap / features
This section outlines the important directories, its related purpose and data requirements within the app. 

## data normalisation & Redux store
### `index.js`
Being the entry point of the store, this section is where we define the store from the initial state (defined in `normalize-data.js` and `initial-state.js`), and contains all the neccessary subscribe functions that is called within the initial configuration of the store.  This includes the `updateGraphOnChange` function that listens and updates the store with latest calculations from the `getGraphInput` selector, as well as the `saveStateToLocalStorage` function that saves selected attributes in the localStorage of the user's browser. 
### `normalize-data.js`
This is the place where we define the initial instance of fields within the initial state that stores the pipeline data, including all sub-pipeline ids, nodes, edges, tags, etc. This also includes all the related functions for breaking down important fields of raw pipeline data (such as `nodes`, `edges` and `tags` ) into our defined format for its state before its addition into the state and the redux store in `index.js`. 

### `initial-state.js`
This is the place where we define the initial instance of the state for all non-pipeline / app-related fields, including `flags`, `themes`, loading states, visible elements within the app, etc, as well as the place where we define the final initial state of the store by combining the fields for the pipeline data as defined in `normalize-data.js` with the non-pipeline fields defined in this file. 

Architectural invariant: the non-pipeline state takes in the values saved in the localStorage of the user's browser (given that there are saved values) during the initialization of the non-pipeline state to preserve the saved preferences of the user's previous session. 

## `actions`
As mentioned in our previous section, we follow the redux pattern in using `actions` to perform all actions for data-fetching and updates to the state throughout the app. This is the directory where we state all defined actions for various types of data, breaking down into further files for each relevant type of data, along with its relevant suite of tests. 

`index.js` lists all general actions defined for UI-related settings (such as toggling between themes, text labels, etc); `nodes.js` lists all actions related to the data-fetching and display of node metadata (for the node metadata panel); `pipelines.js` lists all actions related to the data-fetching and updating of the pipeline data, where, on having triggered an async action to fetch pipeline data, all raw pipeline data returned from the API will be further processed and updated in the state via the `loadPipelineData` function in `pipelines.js`. 

`graph.js` lists all actions related to the toggling of elements on the flowchart / pipeline graph. 

### `reducers`
We utiilze reducers to format any raw data from the API and update our state according to any triggered actions. Similar to actions, we break down into seperate files for each data type, such as `nodes.js`, `pipeline.js`, etc.

One important concept to note is that the `nodeReducer` in `nodes.js` is where the raw node metadata from the API gets prepared before updating the state. 

### `selectors`
For data derived from calculation from the state, we utiilze reducers to perform our calcuations and prepare our data for specfic use cases for different parts of the app. 

For example, `getGraphLayout` within `layout.js` prepares an input object containing all `nodes`, `edges`, `layers`, and status of the graph flag to be imported as a prop into the flowchart component. 

### `utils`
The utils folder contains a set of data and functions that are utilized throughout the app. 

`/data` contains a series of json files that serves as mock data for the tests, which along with `state.mock.js`, provides a set of mock data and state that are heavily utilized in the test suites within the app. 

`config.js` provides all fixed configuration values in the app, such as types of flags, sidebar widths, localStroage name, etc. 

`/graph` contains all calculation tools utilized within the flowchart component.

`worker.js` provides all webworker-related utilities (including mocks). 

`flags.js` provides all functions related to the configuration of the feature flag object that acts as a control on experimental features in Kedro-Viz. (For further details please refer to the 'Cross Cutting Concern' section below.)

### `/tools/test-lib` (for react-component import)
Other than running as a stand-alone webapp, Kedro-viz is also avaliable as an npm package to be imported in any external web project. The `test-lib` directory provides a react project that allows the testing Kedro-viz as a npm package. (the page is accessible via the `npm lib-test` cli command.)
### D3 chart rendering, zoom & chartSize calcs
The flowchart component, and all its related calculation relating to the zoom and chartSize calculation with the D3 library, is a major part of Kedro-viz. The drawing and the calculation logic exists the various areas throughout the app.

`/components/flowchart` is the component directory for the rendering of the pipeline flowchart; `index.js` contains all logic pertaining to the react lifecycles for the optimization of the rendering of the flowchart, while `draw.js` contains majority of the D3 zoom transition calculations and the rendering of the flowchart. 

The logic behind the layout calculations are controlled via the functions and constraints listed in `utils/graph/layout.js`, while `utils/graph/view.js` contains functions that decides on view transformation of the graph in accordance to the viewport size. 
