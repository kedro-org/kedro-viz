# Copyright 2018-2019 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
# NONINFRINGEMENT. IN NO EVENT WILL THE LICENSOR OR OTHER CONTRIBUTORS
# BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF, OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
# The QuantumBlack Visual Analytics Limited ("QuantumBlack") name and logo
# (either separately or in combination, "QuantumBlack Trademarks") are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
#     or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.


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
    url="https://github.com/quantumblacklabs/kedro-viz",
    python_requires=">=3.5, <3.8",
    install_requires=requires,
    tests_require=test_requires,
    keywords="pipelines, machine learning, data pipelines, data science, data engineering, visualisation",
    author="QuantumBlack Labs",
    packages=["kedro_viz"],
    package_data={"kedro_viz": list(files)},
    zip_safe=False,
    setup_requires=["pytest-runner==4.2"],
    entry_points={"kedro.project_commands": ["kedro-viz = kedro_viz.server:commands"]},
)
