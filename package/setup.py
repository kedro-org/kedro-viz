# type: ignore
import json
import os
from os import path

from setuptools import find_packages, setup

name = "kedro-viz"
here = path.abspath(path.dirname(__file__))


jsbuild = [
    os.path.join(dirpath, f)
    for dirpath, dirnames, files in os.walk("kedro_viz/html/")
    for f in files
]

files = map(lambda x: x.replace("kedro_viz/", "", 1), jsbuild)

with open(path.join(here, path.pardir, "package.json")) as data:
    obj = json.load(data)
    version = obj["version"]

with open("requirements.txt", "r", encoding="utf-8") as f:
    requires = [x.strip() for x in f if x.strip()]

# get test dependencies and installs
with open("test_requirements.txt", "r", encoding="utf-8") as f:
    test_requires = [x.strip() for x in f if x.strip() and not x.startswith("-r")]

# Get the long description from the README file
with open(path.join(here, "../README.md"), encoding="utf-8") as f:
    readme = f.read()


setup(
    name=name,
    version=version,
    description="Kedro-Viz helps visualise Kedro data and analytics pipelines",
    long_description=readme,
    long_description_content_type="text/markdown",
    license="Apache Software License (Apache 2.0)",
    url="https://github.com/kedro-org/kedro-viz",
    python_requires=">=3.7, <3.9",
    install_requires=requires,
    tests_require=test_requires,
    keywords="pipelines, machine learning, data pipelines, data science, data engineering, visualisation",
    author="Kedro",
    packages=find_packages(exclude=["tests*", "features*"]),
    package_data={"kedro_viz": list(files)},
    zip_safe=False,
    entry_points={
        "kedro.global_commands": ["kedro-viz = kedro_viz.launchers.cli:commands"],
        "kedro.line_magic": ["line_magic = kedro_viz.launchers.jupyter:run_viz"],
    },
)
