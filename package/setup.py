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
)
