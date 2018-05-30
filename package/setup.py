import glob
import json
from os import path

from setuptools import setup, find_packages

name = 'carbonviz'
here = path.abspath(path.dirname(__file__))

files = map(lambda x: x.replace("carbonviz/", "", 1),
            glob.glob('carbonviz/build/**/*', recursive=True))

with open(path.join(here, path.pardir, 'package.json')) as data:
    obj = json.load(data)
    version = obj['version']

setup(
    name=name,
    version=version,
    description='CarbonViz is the visualisation tool used by CarbonAI',
    url='https://github.com/quantumblack/carbon-ai-pipeline-viz',
    packages=find_packages(),
    package_data={
        'carbonviz': list(files)
    },
    install_requires=[
        'Flask>=1.0, <2.0'
    ],
    author='QuantumBlack',
    author_email='feedback@quantumblack.com',
    entry_points={
        'console_scripts': ['carbonviz = carbonviz.server:main']
    }
)
