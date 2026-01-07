import os


def env_override(default_appid):
    """
    Select Heap App ID based on Read the Docs build version.

    - "latest" -> QA environment (HEAP_APPID_QA)
    - "stable" -> Production environment (HEAP_APPID_PROD)
    - other -> Development (default_appid)
    """
    build_version = os.getenv("READTHEDOCS_VERSION")

    if build_version == "latest":
        return os.environ.get("HEAP_APPID_QA", default_appid)
    if build_version == "stable":
        return os.environ.get("HEAP_APPID_PROD", "2388822444")

    return default_appid  # default to Development for local builds


def on_env(env, config, files):
    """Register custom Jinja2 filters."""
    env.filters["env_override"] = env_override
    return env
