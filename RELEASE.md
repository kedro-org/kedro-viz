# Upcoming release:

<!--
Use the sections below to add notes for the next release.

Please follow the established format:
- Keep each note concise - ideally commit title length
- Use present tense (e.g. 'Add new feature')
- Include the ID number for the related PR (or PRs) in parentheses
-->

## Major features and improvements

<!-- Add release notes for the upcoming release here -->

## Bug fixes and other changes

<!-- Add release notes for the upcoming release here -->

# Release 3.8.1

## Bug fixes and other changes

- Temporarily disable internal CSS in exported SVGs to fix CORS error when exporting images (#337)
- Fix tests for Kedro 0.17 (#338)

# Release 3.8.0

## Major features and improvements

- Finish the new node metadata side panel, which allows you to switch between different modular pipelines. This feature is no longer hidden behind a flag, and the 'meta' flag has been removed. (#293, #309, #312, #320, #321, #326, #295, #329, #333)
- Enable the new graphing layout algorithm by default, and remove the 'newgraph' feature flag. If necessary, you can still revert back to the old layout algorithm by enabling the 'oldgraph' flag. (#334, #335)
- Add experimental flagged feature to allow lazy-loading of sidebar node-list rows on scroll. This improves performance by not forcing the app to render the entire node-list on larger graphs. This feature is disabled by default, but can be enabled using the 'lazy' feature flag. (#307)
- Use CSS custom properties for theme colours (#301, #319)

## Bug fixes and other changes

- Update Kedro-UI to v1.1.4. This enables us to improve webfont-loading detection, add a transition-out for closing the pipeline dropdown, add an active pipeline menu-option border-left colour, and improve accessibility when disabling the pipeline dropdown. (#325)
- Support launching a development server against a real pipeline. This is still a work-in-progress, and we will announce when it can be used. (#318, #327)
- Unify backend and frontend test data, to help prevent bugs appearing in future due to mismatched API schemas between frontend & backend (#298)
- Fix tag list icon hover state styling (#316)
- Update various dependency versions via Dependabot (#315, #330, #331)
- Fix linters (#323)
- Add default fallback response for non-main API calls (#328)
- Remove get_project_context(), now that we no longer support old versions of Kedro (<0.15) (#324)
- Add a 'private' flag prop, to hide flags for in-development features from the flags console announcement (#322)
- Investigate the root cause of nodes being undefined in Safari (#310)
- Fix bug that caused missed click on the flowchart (#317)
- Change demo.mock to a .json file and update tests (#314)
- Disable Python 3.6/3.7 jobs in daily CI workflow (#313)
- Batch tag actions to improve performance when toggling multiple tags (#308)

# Release 3.7.0

## Major features and improvements

- Finish and release the new pipeline selector, which allows you to switch between different modular pipelines (#286, #294, #296, #297, #302, #303)
- Add phase 1 of the new node metadata panel front-end - behind a feature flag, for now (#276, #303)
- Improve SVG rendering performance (#290)

## Bug fixes and other changes
  
- Fix JS bug in Safari (#306)
- Fix failing CI (#304, #305)
- Don't run eslint against .json files on pre-commit (#292)
- Use the same JSON mock data files for JS+Python end unit/e2e tests (#279)

# Release 3.6.0

## Major features and improvements

- Redesign main sidebar (#236, #283) 
- Drop Kedro 0.14.* support (#277)

## Bug fixes and other changes

- Continue work-in-progress on the multiple pipeline selection dropdown, which is still hidden behind a flag and disabled by default but is nearly complete. (#270, #273, #285, #289)
- Continue work on new metadata panel endpoints (#275)
- Fix chart rendering edge cases and hover styles (#288)
- Update Python unit tests using the same json file as front-end (#281)
- Improve lib-test docs (#278)
- Hide random seed message unless using random data (#280)
- Delete deprecated isParam and schema_id fields (#274)
- Fix bug caused by typo in saveStateToLocalStorage (#271)
- Fix interrupted chart transitions (#269)
- Refactor and optimise flowchart performance (#268)

# Release 3.5.1

## Bug fixes and other changes

- Fix pipeline selector so that it shows the correct default pipeline (#266)

# Release 3.5.0

## Major features and improvements

- **BREAKING CHANGE:** Rename default endpoint from `/api/nodes.json` to `/api/main`. This should only affect local JS development. (#239, #259)
- Add an interactive minimap to the toolbar (#203, #238, #247)
- Add web worker to make the expensive graph layout calculation into an asynchronous action, to prevent it from blocking other tasks on the main thread. (#217)
- Focus search bar with Cmd+F/Ctrl+F keyboard shortcuts (#261)
- Allow an argument to be passed to loadJsonData, for external use if needed (#215)
- Add support for multiple pipelines. This is a work-in-progress, and is currently disabled by default and hidden behind a flag. (#192, #215, #216, #221, #254)
- Begin adding individual node API endpoints, as a prelinary step towards full node metadata sidebars (#252)
- Save disabled state of individual nodes in localStorage (#220)
- Add automated testing for npm package import (#222)
- Rename master branch to main ✊🏿 and deprecate develop (#248)

## Bug fixes and other changes

- Fix prepublishOnly task by changing from parallel jobs to sequential (#264)
- Refactor layer visibility state (#253)
- Reduce toolbar-button height on smaller screens (#251)
- Delete duplicate icon-button component (#250)
- Fix mispelling in demo dataset (#249)
- Improve performance of `getLinkedNodes` (#235)
- Expose node and dataset metadata in "api/nodes/" endpoint  (#231)
- Move react-redux from peerDependencies to regular dependencies, and move react-scripts from dependencies to devDependencies (#223)
- Refactor initial state setup (#220)
- Enable Windows CI  (#218, #241)
- Increase width of layer rects (#209)
- Update various dependency versions via Snyk/Dependabot (#262, #258, #257, #219, #246, #245, #244, #243, #242, #240, #237, #234, #233, #232, #230, #228, #227, #226, #225, #224, #214, #213, #212, #211, #210, #208, #207, #206, #205, #204)

# Release 3.4.0

## Major features and improvements

- Add new graphing algorithm (#185)
- Add feature flags (#185)

## Bug fixes and other changes

- Protect URL constructor/searchParams where browser support is limited. (#201)
- Consolidate mock datasets and delete unnecessary ones (#200)
- Update SSH key fingerprint in CircleCI config (#199)
- Add layers to demo data (#198)
- Improve random generator variations (#187)

# Release 3.3.1:

## Bug fixes and other changes

- Apply the Black formatter to back-end Python code  (#193)
- Bump websocket-extensions from 0.1.3 to 0.1.4 (#190)
- Autoformat Python code using Black (#188)
- Stop layout calculation from running twice on page-load, and optimise getNodeTextWidth selector performance (#186)
- Fix `%run_viz` line magic to display kedro viz inside Jupyter notebook, previously broken for kedro 0.16.0/0.16.1. Note that the fix needs `kedro>=0.16.2` to take effect. (#184)
- Fix three minor tooltip triangle styling bugs (#182)
- Update readme/contributing docs (#181, #196)
- Update the semver requirement version (#180)
- Seed randomly-generated data with UUIDs, to allow random layouts to be replicated for testing purposes (#178, #197)
- Update pipeline visualisation screenshot in Readme (#177)

# Release 3.3.0:

## Major features and improvements

- **BREAKING CHANGE:** Drop support for Python 3.5 (#138)
- Add support for Python 3.8 (#173)
- Add data engineering layers (#129, #145, #146, #148, #157, #161)
- Redesign sidebar node-list and node selected states (#144, #152, #153, #155, #162, #164, #171)
- Update overall colour scheme, and improve print/export styles (#169)
- Move icon stack column to right edge of the main sidebar (#167)
- Wrap tooltip names & invert tooltip in top half of screen (#158)
- Limit zoom scale/translate extent (#137, #174)

## Bug fixes and other changes

- Fix deprecation warnings when running kedro viz from Kedro 0.16 (#170)
- Remove the need to transition layer height on zoom (#166)
- Refactor config.js & move random-data import (#163)
- Fix bug where exported PNG was cut off (#151)
- Make dataPath relative again (#149)
- Remove dateutil hardpinning in requirements.txt (#143)
- Print the stack trace when encountering a generic exception (#142)
- Web browser will only be opened if the host corresponds to localhost (#136)
- Upgrade pylint to 2.4 (#135)
- Add bandit for security scanning as a pre-commit hook (#134)
- Add logger configuration when loading pipeline from JSON (#133)
- Update svg-crowbar to reduce exported SVG filesize (#127)
- Guard global window references to fix SSR (#126)
- Move visibleNav/navWidth calculations into Redux store (#124)
- Remove truffleHog pinned dependency (#122)

## Thanks for supporting contributions

[Ana Potje](https://github.com/ANA-POTJE)

# Release 3.2.0:

## Major features and improvements

- Dynamically allocate port number for the viz subprocess created by `%run_viz` if 4141 is taken (#109)
- Redesign sidebar list to group nodes by type (#96)
- Add `--pipeline` option to visualize modular pipeline (#93)
- Add `--env` option to pass configuration environment (#93)
- Fix backward-compatibility with Kedro 0.14.* (#93)
- Promote Kedro Viz commands from project specific to global commands (#91)
- Allow users to run `kedro viz --load-file` outside of a Kedro project (#91)

## Bug fixes and other changes

- Fix PNG exports (#117)
- Refactor JS actions (#115)
- Update & move CODEOWNERS (#116)
- Update year in license header (#114)
- Refactor JS reducers and state shape (#113)
- Fix Trufflehog secret scan by pinning gitdb2 (#112)
- Add "upcoming release" header back in RELEASE.md (#110)
- Fix Jest+CircleCI test memory errors (#108)
- Improve JavaScript test coverage (#107)
- Refactor JS store (#106)
- Update README to list all available CLI options (#105)
- Use mocker instead of mock in Python unit tests (#104)
- Lint and format Sass with Stylelint (#103)
- Add e2e-tests to check backward-compatibility for Kedro 0.15.0 and latest (#99)
- Add secret scan CircleCI step (#98)
- Update CLI screenshot in README (#95)
- Increase Python test coverage to 100% (#94)
- Update CI config for daily run (#90)
- Snyk fix for vulnerabilities (#87, #92, #101)
- Update the PR template (#46, #111)

# Release 3.1.0:

## Major features and improvements

- **BREAKING CHANGE:** Kedro<0.15.0 no longer works with this version of Kedro-Viz (#72)
- Allow users to export graph as a transparent SVG/PNG image (#82)
- Add theme prop and icon button visibility prop (#80)
- Rename `get_data_from_kedro` to `format_pipeline_data` (#72)
- Add pipeline and catalog arguments to `format_pipeline_data` (#72)

## Bug fixes and other changes

- Remove Appveyor config file + readme badge (#86)
- Add explicit dependency on `psutil` (#85)
- Improve json file-loading error message (#81)
- Update kedro-ui/react-scripts/dagre/snyk dependencies (#83, #84, #88)
- Remove leftover traces of the created_ts and message data properties (#80)
- Change relative links to absolute, to fix docs on npmjs.org (#79)

# Release 3.0.1:

## Bug fixes and other changes

- Add python-dateutil==2.8.0 to resolve CI errors (#78)
- Add data-id attributes on nodes and edges (#76)
- Fix issues with SVG imports when embedded (#75)
- Allow chart to resize with parent container when embedded (#74)

# Release 3.0.0:

## Major features and improvements

- **BREAKING CHANGE:** Deprecate and remove Snapshots/History feature (#42)
- **BREAKING CHANGE:** Make 'parameters' a distinct node type from 'data' (#53)
- Add new data/task/parameters icons (#62, #53)
- Add icons to node labels (#65)
- Enable Kedro-Viz to be run in Jupyter Notebook (#59)
- Change task full names to be the underlying function name, and use them in tooltips (#53, #61)
- Replace node IDs with shorter hashes (#53)
- Redesign the theme colour schemes to make them simpler and more consistent, and refactor active/highlight/hover/click state CSS for nodes & edges (#52)
- Sort nodes by their x/y position to improve tabbing order (#51)
- Move the theme and label toggle switches into icon buttons (#47)
- Add new demo data (#44)
- Allow Python users to load/save pipeline data to/from a JSON file via the CLI (#43)

## Bug fixes and other changes

- Change git address protocol in package-lock (#71)
- Update Kedro-UI to v1.1.1 (#70)
- Fix sidebar show/hide transitions in Safari (#68)
- Improve tabbing order (#67)
- Fix webfont text-width chart layout bug (#65)
- Desaturate the background colour a touch (#64)
- Move drawChart method to its own JS file (#63)
- Update Snyk to 1.234.2 and patch issue  (#60)
- Set the 'show sidebar' button to hidden when open (#57)
- Snyk fix for 1 vulnerability (#56)
- Various CSS tweaks and bugfixes (#54)
- Remove getEdgeDisabledView selector (#49)
- Update Kedro-UI to v1.1.0 (#48)
- Fix badge URL typos in Readme (#45)

## Migration guide from Kedro-Viz 2.\*.\* to Kedro-Viz 3.0.0

If you are just using Kedro-Viz with Kedro as a Python package, you won't need to do anything. The breaking changes in this release only affect the few users who are working on the application locally, or importing it from [npm](https://www.npmjs.com/package/@quantumblack/kedro-viz) and consuming it as a React component.

- The format for data passed to Kedro-Viz has changed. You can see examples of the new data format in the [`src/utils/data`](./src/utils/data) directory. The main change is that the format no longer supports multiple snapshots in a single dataset. Instead of [this](https://github.com/quantumblacklabs/kedro-viz/blob/243fd1bb513023086e77bca9f8469e00d1182437/src/utils/data.mock.js):
  ```
  {
    snapshots: [
      {
        schema_id: '310750827599783',
        nodes: [...],
        edges: [...],
        tags: [...],
      },
      ...
    ]
  }
  ```
  You can now use something like [this](https://github.com/quantumblacklabs/kedro-viz/blob/c75c499507617a01fb327c366b9d639229f1d921/src/utils/data/demo.mock.js):
  ```
  {
    nodes: [...],
    edges: [...],
    tags: [...],
  }
  ```
- The `showHistory`, `allowHistoryDeletion`, and `onDeleteSnapshot` props on the main App component have been deprecated. These no longer do anything, and can be removed.
- A new `parameters` value for the node `type` property has been created. This replaces the previous `is_parameters` Boolean property. To migrate previous data, find any nodes where `is_parameters: true`, and change the `type` value from `data` to `parameters`. e.g. from this:
  ```
  {
    tags: ['Nulla', 'pulvinar', 'enim', 'consectetur', 'volutpat'],
    id: 'task/consectetur',
    is_parameters: false,
    type: 'task',
    full_name: 'consectetur',
    name: 'consectetur'
  }
  ```
  to this:
  ```
  {
    tags: ['Nulla', 'pulvinar', 'enim', 'consectetur', 'volutpat'],
    id: 'task/consectetur',
    type: 'parameters',
    full_name: 'consectetur',
    name: 'consectetur'
  }
  ```


# Release 2.1.1:

## Bug fixes and other changes
- Don't ignore gh-pages branch in CircleCI (#33)
- Document the React props and data format (#34)
- Fix closing of the navbar on smaller screens (#35)
- Use What Input? to set obvious keyboard focus state (#36)
- Add Konami code easter egg (#37)
- Extend snyk patch expiry duration to 1 year (#39)
- Fix react dependency issues (#40)

# Release 2.1.0:

## Major features and improvements

- Toggle linked-node active state on click (#20)

## Bug fixes and other changes

- Pin pip version to be less than 19.2 (#24)
- Unpin pip version (#25)
- Fix infosec vulnerability in LoDash (#16)
- Remove license checkers (#28)
- Make Viz backwards-compatible with Kedro 0.14.0 (#30)
- Automatically deploy demo builds to Github Pages (#26)

# Release 2.0.0:

## Major features and improvements

- **BREAKING CHANGE:** Refactor the JSON data input API. The new format is more verbose, but is very extensible, and will allow us to add more metadata about each node, edge and tag in future (#2, #8, #21, #23)
- Calculate transitive links when a chart is rendered, rather than when the initial data is formatted (#8)

## Bug fixes and other changes

- Run extra checks (e.g. tests, linter, build & lib) before publishing to npm (#12)
- Document the --host command line flag in the readme (#14)
- Add a CODEOWNERS file (#15)
- Update Flask caching so that only static assets are cached forever (#17)
- Fix buggy edge change animation for cases where the SVG path length changes, using d3-interpolate-path (#22)
- Fix broken Python version badge in Readme (#18)
- Add CI status badges in Readme (#19)
- Add Appveyor configuration (#19)

## Migration guide from Kedro-Viz 1.\*.\* to Kedro-Viz 2.0.0

- The data input format has been significantly changed. This will only affect users of the JavaScript package - regular Kedro users will not be affected. To see examples of the old API format compares to the new one, see the changes to `data.mock.js` in [this commit](https://github.com/quantumblacklabs/kedro-viz/pull/8/files#diff-837826676eaada9374ec654c892af095).

## Thanks for supporting contributions

[Yusuke Minami](https://github.com/Minyus)

# Release 1.0.2:

## Bug fixes and other changes

- Fix a minor bug in how zoom centering was handled when the sidebar is open (#10)
- Make the Makefile easier to read (#9)
- Fix some minor issues with Readme images and badges (#11)

# Release 1.0.1:

## Major features and improvements

- Add a Make script to automate version updates and tagging across both JS and Python files (#7)
- Add tool to automatically check whether legal headers are present on Python scripts (#5)

## Bug fixes and other changes

- Fix broken CSS in the Tags drop-down menu (#6)
- Remove smart quotes and replace them with regular quotes, to avoid "Non-ASCII character" errors when building the Sphinx docs. (#4)

# Release 1.0.0:

The initial release of Kedro-Viz.

## Thanks to our main contributors

[Richard Westenra](https://github.com/richardwestenra), [Nasef Khan](https://github.com/nakhan98), [Ivan Danov](https://github.com/idanov), [Gordon Wrigley](https://github.com/tolomea), [Huong Nguyen](https://github.com/Huongg), [Ottis Kelleghan](https://github.com/ottis), [Yetunde Dada](https://github.com/yetudada), [Kiyohito Kunii](https://github.com/921kiyo), [Dmitrii Deriabin](https://github.com/DmitryDeryabin), [Peteris Erins](https://github.com/Pet3ris), [Jo Stichbury](https://github.com/stichbury)

We are also grateful to everyone who advised and supported us, filed issues or helped resolve them, asked and answered questions and were part of inspiring discussions.
