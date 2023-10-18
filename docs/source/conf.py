# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information


from __future__ import annotations

import importlib
import os
import re
import sys
from inspect import getmembers, isclass, isfunction
from pathlib import Path

from click import secho, style

from kedro import __version__ as release

# -- Project information -----------------------------------------------------

project = "kedro-viz"
author = "kedro-viz"

# The short X.Y version.
version = re.match(r"^([0-9]+\.[0-9]+).*", release).group(1)


# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
    "sphinx_copybutton",
    "myst_parser",
    "notfound.extension",
]


# Add any paths that contain templates here, relative to this directory.
templates_path = ["_templates"]
html_static_path = ["_static"]

exclude_patterns = []
source_suffix = {".rst": "restructuredtext", ".md": "markdown"}

myst_heading_anchors = 2

# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = "sphinx_rtd_theme"


# Theme options are theme-specific and customise the look and feel of a theme
# further.  For a list of options available for each theme, see the
# documentation.
#
html_theme_options = {"collapse_navigation": False, "style_external_links": True}

# Removes, from all docs, the copyright footer.
html_show_copyright = False

html_context = {
    "display_github": True,
    "github_url": "https://github.com/kedro-org/kedro/tree/main/docs/source",
}
