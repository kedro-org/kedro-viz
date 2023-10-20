# type: ignore
import json
import os
from os import path

from setuptools import setup

name = "kedro-viz"
here = path.abspath(path.dirname(__file__))

jsbuild = [
    os.path.join(dirpath, f)
    for dirpath, dirnames, files in os.walk("kedro_viz/html/")
    for f in files
]

files = map(lambda x: x.replace("kedro_viz/", "", 1), jsbuild)

setup(
    package_data={"kedro_viz": list(files)},
    zip_safe=False,
    entry_points={
        "kedro.global_commands": ["kedro-viz = kedro_viz.launchers.cli:commands"],
        "kedro.line_magic": ["line_magic = kedro_viz.launchers.jupyter:run_viz"],
        "kedro.hooks": [
            "kedro-dataset-stats = kedro_viz.integrations.kedro.hooks:dataset_stats_hook"
        ],
    },
    extras_require={
        "docs": [
            "sphinx~=5.3.0",
            "sphinx_copybutton==0.3.1",
            "sphinx-notfound-page",
            "sphinx_rtd_theme==1.2.0",
            "myst-parser~=1.0.0",
        ],
    },
)
