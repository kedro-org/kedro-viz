import json
from os import path

from setuptools import setup, find_packages

name = 'kernelviz'
here = path.abspath(path.dirname(__file__))

import os

jsbuild = [os.path.join(dirpath, f)
           for dirpath, dirnames, files in os.walk('kernelviz/html/')
           for f in files]

files = map(lambda x: x.replace("kernelviz/", "", 1), jsbuild)

with open(path.join(here, path.pardir, 'package.json')) as data:
    obj = json.load(data)
    version = obj['version']

setup(
    name=name,
    version=version,
    description='KernelViz is the visualisation tool used by KernelAI',
    url='https://github.com/quantumblack/asset-kernel-viz',
    packages=find_packages(),
    package_data={
        'kernelviz': list(files)
    },
    install_requires=[
        'Flask>=1.0, <2.0'
    ],
    author='QuantumBlack',
    author_email='feedback@quantumblack.com',
    entry_points={
        'console_scripts': ['kernelviz = kernelviz.server:main']
    }
)
