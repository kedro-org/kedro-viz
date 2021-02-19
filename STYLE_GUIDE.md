# Style Guide

This document outlines recommended code style, quirks, and best practices for development on Kedro-Viz.

<!-- @TODO table of contents -->

## General

###  Browser and device support

We aim to support recent versions of major modern browsers - i.e. Chome, Firefox, Edge, Safari, and Opera, on both MacOS and Windows. Keeping progressive enhancement in mind, we aim for decent mobile support where possible, i.e. nothing should be broken on mobile, but it's okay for mobile/older browsers to have a slightly degraded experience.

### Accessibility

We aim to meet [WCAG 2.1 Level AA](https://www.w3.org/WAI/standards-guidelines/wcag/) standards where possible, while acknowledging that this is a data visualization, so some criteria will be difficult to pass without extraordinary effort. However we will do our best within reason.

Kedro-Viz should be navigable with different input devices (e.g. mouse, keyboard, and touchscreen), with obvious and visible focus states on all interactive elements. Text elements should have sufficient colour contrast and font-size to ensure readability to a minimum Level AA standard. Use [WAI-ARIA](https://www.w3.org/WAI/standards-guidelines/aria/) features where applicable to improve screenreader support.

We recommend checking [axe](https://www.deque.com/axe/) and [Lighthouse](https://developers.google.com/web/tools/lighthouse) to review for potential accessibility errors if unsure.


## HTML

### Semantics

Ensure that page content is marked up with [semantic HTML elements](https://html.com/semantic-markup/) in order to ensure that it is as usable and accessible as possible.

Avoid:
```jsx
<div className="form">
  <div>Contact us</div>
  <div>Use this form to send us a message.</div>
  <div>Email address:</div>
  <input type="text" />
  <div onClick={handleSubmit}>Submit</div>
</div>
```
Prefer:
```jsx
<form onSubmit={handleSubmit}>
  <h1>Contact us</h1>
  <p>Use this form to send us a message.</p>
  <label htmlFor="email">Email address:</label>
  <input id="email" type="email" />
  <button>Submit</button>
</form>
```


## CSS

### SCSS/Sass

<!-- Kedro-Viz uses Sass. @TODO -->

### Code style and linting

We use [stylelint](https://stylelint.io/) to lint our SCSS. For the most part, we use the default config - you can find specific details in the `.stylelintrc` config file.  
We recommend installing the Prettier and stylelint plugins for your text-editor, and enabling automatic formatting on save.

### Class names

This project uses the [BEM naming convention](http://getbem.com/), to avoid conflicts, reduce rule specificity, and make classes easier to read and understand.

We use the `pipeline-` prefix for most HTML/CSS classes, to avoid polluting the global namespace when this project is imported into other applications.

<!-- @TODO Explain usage of the 'kedro' class, Kedro-UI, and webfonts -->

### Variables

<!-- @TODO -->

### Colours

<!-- @TODO -->

### Units (em, %, px, etc)

<!-- @TODO -->


## JavaScript

### Code style and linting

We use [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) to lint our JavaScript. For the most part, we use the default config - you can find specific details in the `.prettierrc` and `.eslintrc.json` config files. We recommend installing the Prettier and ESLint plugins for your text-editor, and enabling automatic formatting on save.

Other than that, we mostly recommend following the [AirBnB JavaScript Style Guide](https://github.com/airbnb/javascript).

### Imports

Although it will work in regular development (because this project uses React-Scripts), avoid importing non-standard file-types like `.scss` and `.svg` directly into JavaScript files. This is because these won't work without specific webpack loaders, so when Kedro-Viz is imported into other projects, it will break. The `lib-test` testing suite exists partly for this reason, to check that Kedro-Viz still works when imported as a componnent library into a fairly standard JS app.

###  Testing

In accordance with McKinsey standards, we aim to maintain at least a test coverage of at least 70% averaged across the codebase. As it's not practical to write tests for every JavaScript file, we usually aim for closer to 90% on most files, so that the project average continues to exceed the expected minimum standard.

We use Jest, Enzyme, and React-Testing-Library for JavaScript testing. Most of the older tests are written with Enzyme, but we are beginning to write more tests using Testing-Library as it is more flexible for testing certain browser APIs. Either is acceptable. To help with mocking the Redux store, Enzyme helper utilities can be found in `/src/utils/state.mock.js`.

<!-- @TODO Explain the usage of the different datasets in testing, and add more comments explaining how the load-data mock works. -->


## Git and Github

### Commits

Write commit subjects/titles in the imperative mood. Try to be as specific and detailed as you can, while keeping the subject under 50 characters so that isn't truncated when displayed. If it's a complicated or unclear change and more detail would help future readers understand the commit, please consider adding a detailed description of what you changed and why.

Here's a great template of a good commit message [originally written by Tim Pope](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html):

```
Capitalized, short (50 chars or less) summary

More detailed explanatory text, if necessary.  Wrap it to about 72
characters or so.  In some contexts, the first line is treated as the
subject of an email and the rest of the text as the body.  The blank
line separating the summary from the body is critical (unless you omit
the body entirely); tools like rebase can get confused if you run the
two together.

Write your commit message in the imperative: "Fix bug" and not "Fixed bug"
or "Fixes bug."  This convention matches up with commit messages generated
by commands like git merge and git revert.

Further paragraphs come after blank lines.

- Bullet points are okay, too

- Typically a hyphen or asterisk is used for the bullet, followed by a
  single space, with blank lines in between, but conventions vary here

- Use a hanging indent

If you use an issue tracker, add a reference(s) to them at the bottom,
like so:

Resolves: #123
```

### Pull Requests

Like commit titles, PR titles should ideally be written in the imperative present tense and should summarise the changes made. If there is a JIRA ticket for the task, add the ticket ID to the PR/issue title.

Avoid:
> API queries are broken

Prefer:
> [KED-1234] Fix broken API queries

PR descritions should contain a description of what's been changed and why. Use the 'Development notes' and 'QA notes' sections to explain anything that maintainers should be aware of when reviewing the code and QAing the branch, respectively. For instance, if there's something you were unsure about, mention it in your notes so that the reviewer knows to pay it extra attention - maybe they'll have a suggestion for how you can improve it. 

When merging a PR, use a squash commit. Remove the JIRA ticket ID from the merge commit subject, as including it often truncates the commit subject. If necessary, edit the commit subject to ensure that it fits under 50 characters. Click the 'Cancel' link to avoid updating the PR title when you do this.

Add a detailed description to the merge commit - usually, the PR description will suffice. This commit is what shows up in the git blame/history, so it’s critical to make sure that it’s useful and informative.

### Deployment process

<!-- @TODO - should this be here? or in a different doc? -->