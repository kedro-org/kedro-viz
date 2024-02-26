# type: ignore
import json
import os

from setuptools import setup

here = os.path.abspath(os.path.dirname(__file__))

jsbuild = [
    os.path.join(dirpath, f)
    for dirpath, dirnames, files in os.walk("kedro_viz/html/")
    for f in files
]

files = map(lambda x: x.replace("kedro_viz/", "", 1), jsbuild)

with open(os.path.join(here, os.path.pardir, "package.json")) as data:
    obj = json.load(data)
    version = obj["version"]

# Static pyproject.toml cannot access anything above current directory
with open(os.path.join(here, "../README.md"), encoding="utf-8") as f:
    readme = f.read()

setup(
    version=version,
    long_description=readme,
    long_description_content_type="text/markdown",
    package_data={"kedro_viz": list(files)},
)
