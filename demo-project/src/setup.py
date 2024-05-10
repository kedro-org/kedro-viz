from setuptools import find_packages, setup

entry_point = "demo-project = demo_project.__main__:main"


# get the dependencies and installs
with open("requirements.txt", "r", encoding="utf-8") as f:
    # Make sure we strip all comments and options (e.g "--extra-index-url")
    # that arise from a modified pip.conf file that configure global options
    # when running kedro build-reqs
    requires = []
    for line in f:
        req = line.split("#", 1)[0].strip()
        if req and not req.startswith("--"):
            requires.append(req)

setup(
    name="demo_project",
    version="0.1",
    packages=find_packages(exclude=["tests"]),
    entry_points={"console_scripts": [entry_point]},
    install_requires=requires,
    extras_require={
        "docs": [
            "kedro-sphinx-theme==2024.4.0",
            "ipykernel>=5.3, <7.0",
        ]
    },
)
