# Architecture

This document describes the high-level architecture of Kedro-Viz. This would be a great starting point for you to get familiar with the codebase and our cross cutting concerns throughout the app. 

See also the contributing docs, which walks through our set of guidelines and recommended best practices for our codebase. 

# High-level Overview

![Kedro-Viz entry point diagram](https://github.com/quantumblacklabs/kedro-viz/blob/main/.github/img/app-architecture-entry-points.png?raw=true)

On a high-level, Kedro-viz is a web-app that accepts pipeline data as an input and produces a interactive visualization graph to represent an overview of the current state of the pipeline of the Kedro project. 

More specifically, kedro-viz consumes pipeline data in a specific object format that includes all pipelines, edges and nodes of the Kedro project, meanwhile the Kedro-viz API layer makes request to the Kedro project for further details of a node object, which will be requested and displayed on user clicking a node on the flowchart. 

One important thing to note is the concept of a 'node' in Kedro-viz, which is different from the concept of 'node' in Kedro. A 'node' on Kedro-viz refers to an element for display on the flowchart, which could be either a 'database', 'parameter' or 'task' element. Each node has its own `node-type`, which currently consists of 3 types: `task` (which refers to a Kedro node that is a python function that takes inputs and outputs),`parameters`, and `datasets`. 

An edge represents the link between 2 kedro-viz nodes, as represented by a line between 2 kedro-viz nodes. 

Kedro-viz is made up of two main parts: the front-end web-app UI that is built on React, and an API layer that pulls data from the Kedro project on which Kedro-viz is running on. The web-app is developed on Javascript with the React library, while the API layer is written in Python. 

Currently, the API has 3 endpoints: `/api/pipeline/<id>`, `/api/node/<id>` and `/api/main`. Each endpoint is called via actions within the app. 

Kedro-viz can exist either as a standalone web-app (via spinning up the web-app from a bash command with data consumed from a running Kedro project), or as a react component that can be imported in any external web-app (consuming data from a JSON file instead of a running Kedro project).  

# Data

### Requirements
Kedro-viz requires three type of data input: pipeline data for the main flowchart and sidebar visualization (an object that includes a list of sub-pipelines, edges and nodes of the pipeline/project to visualize), node metadata for the metadata panel (for three different types of Kedro elements: task, parameters and datasets; each element type requires a different set of fields within the object), and data from localStorage in the user's browser ( provided that the user has previously launched Kedro-viz on their browser ). 

The app supports the loading of synchronous data via the `/api/main` endpoint, and asynchronous data via the kedro-viz server for both the `/api/pipeline<id>` and `/api/node/<id>` endpoints. 

### origins / sources
As a standalone app, Kedro-viz can either obtains its pipeline data from the server via a running kedro project, or if during app development, from a fixed mock data source (in the form of JSON file within the app, such as `animals.mock.json`, `demo.mock.json` ). 

As a library import (via npm), the Kedro-viz component allows pipeline data to be passed on as a prop from the external parent react app. 

The node metadata are obtained by calling the `/nodes/<id>` endpoint on the kedro server, which will extract the node data from a running kedro project. Please note that given the node metadata information can only be extracted by the kedro-server (given the dynamic nature of the data), hence the Kedro-viz component library currently does not support the display of node metadata. 

Kedro-viz also extracts localStorage data from the user's browser for app state data (such as `node`, `pipeline`, `tags`, `theme`, etc) that is stored from the user's last session, while extracting the user's preference for flags settings via the browser url. (please refer to lower sections for details on flags)

### data flow
![Kedro-Viz data flow diagram](https://github.com/quantumblacklabs/kedro-viz/blob/main/.github/img/app-architecture-data-flow.png?raw=true)

On initialisation, the app uses a string data token (e.g. 'json' or 'animals') to determine the data source. 

When loading asynchronous data (specified using the json identifier), the app first loads the `/api/main` endpoint. This is because it contains the list of available top-level pipelines, which is necessary to check before loading others. If another pipeline's data is required by the app (which happens on user selection of a sub pipeline via the dropdown in the sidebar), it then loads that pipeline's data from `/api/pipeline/<id>` and replaces the app state with this new data. Conversely, when the user selects a node on the graph, if this node has not previously been selected then the app will request data for this node from `/api/nodes/<id>`.

The initial state data is separated into two: Pipeline and non-pipeline state. This is because the non-pipeline state should persist for the session duration, even if the pipeline state is reset/overwritten - e.g. if the user selects a new top-level pipeline.

The application manually normalises the fetched pipeline data, in order to make immutable state updates as performant as possible. All pipeline and pipeline-related localstorage data will be further ingested via `normalized-data.js` into pipeline state data, 

Next, the app initialises the Redux data store, by merging together initial defaults, window.localStorage data, and the normalized pipeline data, which, together with all non-pipeline related data from localstorage ( such as `theme`, `visible`, etc ), will be used to prepare non-pipeline state data. 

Both sets of data will be combined as initial state data and saved into the store to be used by the app throughout the app lifecycle. 

# Codemap / features
This section outlines the important directories, its related purpose and data requirements within the app. 

## data normalisation & Redux store
We use redux to manage our data flow and state manegement within our web-app. 

Upon firing an action to obtain the pipeline data (either from the `/pipeline` endpoint or via a JSON file), the pipeline data is further prepared and stored within the redux store as a single source of truth within the app. 

All data-fetching from the API and updates to the state within the app are strictly done via actions, while all data are consumed by components either directly through the state or selectors. 

### `/store/index.js`
Being the entry point of the store, this section is where we define the store from the initial state (defined in `normalize-data.js` and `initial-state.js`), and contains all the neccessary subscribe functions that is called within the initial configuration of the store.  This includes the `updateGraphOnChange` function that listens and updates the store with latest calculations from the `getGraphInput` selector, as well as the `saveStateToLocalStorage` function that saves selected attributes in the localStorage of the user's browser. 

### `/store/normalize-data.js`
This is the place where we define the initial instance of fields within the initial state that stores the pipeline data, including all sub-pipeline ids, nodes, edges, tags, etc. This also includes all the related functions for breaking down important fields of raw pipeline data (such as `nodes`, `edges` and `tags` ) into our defined format for its state before its addition into the state and the redux store in `index.js`. 

### `/store/initial-state.js`
This is the place where we define the initial instance of the state for all non-pipeline / app-related fields, including `flags`, `themes`, loading states, visible elements within the app, etc, as well as the place where we define the final initial state of the store by combining the fields for the pipeline data as defined in `normalize-data.js` with the non-pipeline fields defined in this file. 

Architectural invariant: the non-pipeline state takes in the values saved in the localStorage of the user's browser (given that there are saved values) during the initialization of the non-pipeline state to preserve the saved preferences of the user's previous session. 

## `/actions`
As mentioned in our previous section, we follow the redux pattern in using `actions` to perform all actions for data-fetching and updates to the state throughout the app. This is the directory where we state all defined actions for various types of data, breaking down into further files for each relevant type of data, along with its relevant suite of tests. 

`index.js` lists all general actions defined for UI-related settings (such as toggling between themes, text labels, etc); `nodes.js` lists all actions related to the data-fetching and display of node metadata (for the node metadata panel); `pipelines.js` lists all actions related to the data-fetching and updating of the pipeline data, where, on having triggered an async action to fetch pipeline data, all raw pipeline data returned from the API will be further processed and updated in the state via the `loadPipelineData` function in `pipelines.js`. 

`graph.js` lists all actions related to the toggling of elements on the flowchart / pipeline graph. 

### `/reducers`
We utiilze reducers to format any raw data from the API and update our state according to any triggered actions. Similar to actions, we break down into seperate files for each data type, such as `nodes.js`, `pipeline.js`, etc.

One important concept to note is that the `nodeReducer` in `nodes.js` is where the raw node metadata from the API gets prepared before updating the state. 

### `/selectors`
For data derived from calculation from the state, we utiilze reducers to perform our calcuations and prepare our data for specfic use cases for different parts of the app. 

For example, `getGraphLayout` within `layout.js` prepares an input object containing all `nodes`, `edges`, `layers`, and status of the graph flag to be imported as a prop into the flowchart component. 

### `/utils`
The utils folder contains a set of data and functions that are utilized throughout the app. 

`/data` contains a series of json files that serves as mock data for the tests, which along with `state.mock.js`, provides a set of mock data and state that are heavily utilized in the test suites within the app. 

`config.js` provides all fixed configuration values in the app, such as types of flags, sidebar widths, localStroage name, etc. 

`/graph` contains all calculation tools utilized within the flowchart component.

`worker.js` provides all webworker-related utilities (including mocks). 

`flags.js` provides all functions related to the configuration of the feature flag object that acts as a control on experimental features in Kedro-Viz. (For further details please refer to the 'Cross Cutting Concern' section below.)

### `/tools/test-lib` (for react-component import)
Other than running as a stand-alone webapp, Kedro-viz is also avaliable as an npm package to be imported in any external web project. The `test-lib` directory provides a react project that allows the testing Kedro-viz as a npm package. (the page is accessible via the `npm lib-test` cli command.)

### Jest & React testing library
All tests within Kedro-viz are set up with Jest, with some tests set up using React testing library to utilize their `fireEvent` function. 

### D3 chart rendering, zoom & chartSize calcs
The flowchart component, and all its related calculation relating to the zoom and chartSize calculation with the D3 library, is a major part of Kedro-viz. The drawing and the calculation logic exists the various areas throughout the app.

`/components/flowchart` is the component directory for the rendering of the pipeline flowchart; `index.js` contains all logic pertaining to the react lifecycles for the optimization of the rendering of the flowchart, while `draw.js` contains majority of the D3 zoom transition calculations and the rendering of the flowchart. 

The logic behind the layout calculations are controlled via the functions and constraints listed in `utils/graph/layout.js`, while `utils/graph/view.js` contains functions that decides on view transformation of the graph in accordance to the viewport size. 
