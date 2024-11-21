"""demo-project file for ensuring the package is executable
as `demo-project` and `python -m demo_project`
"""

from pathlib import Path

from kedro.framework.project import configure_project

from .cli import run


def main():
    configure_project(Path(__file__).parent.name)
    run()


if __name__ == "__main__":
    main()
