"""`kedro_viz.api.rest.utils` contains utility functions used in the `kedro_viz.api.rest` package"""
try:
    from importlib.metadata import version
except ImportError:  # pragma: no cover
    from importlib_metadata import version


def get_package_version(package_name: str):
    """Returns the version of the given package."""
    return version(package_name)  # pragma: no cover
