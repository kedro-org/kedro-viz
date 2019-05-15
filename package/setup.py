import json
from os import path

from setuptools import setup, find_packages

name = "kedroviz"
here = path.abspath(path.dirname(__file__))

import os

jsbuild = [
    os.path.join(dirpath, f)
    for dirpath, dirnames, files in os.walk("kedroviz/html/")
    for f in files
]

files = map(lambda x: x.replace("kedroviz/", "", 1), jsbuild)

with open(path.join(here, path.pardir, "package.json")) as data:
    obj = json.load(data)
    version = obj["version"]

setup(
    name=name,
    version=version,
    description="KedroViz is the visualisation tool used by Kedro",
    url="https://github.com/quantumblacklabs/kedro-viz",
    packages=find_packages(),
    package_data={"kedroviz": list(files)},
    install_requires=["Flask>=1.0, <2.0"],
    setup_requires=["pytest-runner==4.2"],
    tests_require=["pytest==4.2.0", "pytest-cov==2.6.1"],
    author="QuantumBlack",
    author_email="feedback@quantumblack.com",
    entry_points={
        "console_scripts": ["kedroviz = kedroviz.server:main"],
        "kedro.project_commands": ["kedroviz = kedroviz.plugin:commands"],
    },
)
