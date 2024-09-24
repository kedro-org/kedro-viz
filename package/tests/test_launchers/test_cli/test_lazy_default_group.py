from unittest.mock import MagicMock, patch

import pytest
from click import Context, UsageError

from kedro_viz.launchers.cli.lazy_default_group import LazyDefaultGroup


@pytest.fixture
def lazy_default_group():
    """Fixture for LazyDefaultGroup."""
    return LazyDefaultGroup(
        name="viz_cli_group",
        lazy_subcommands={
            "run": "kedro_viz.launchers.cli.run.run",
            "build": "kedro_viz.launchers.cli.build.build",
        },
        default="build",
        default_if_no_args=True,
    )


def test_lazy_loading(lazy_default_group):
    """Test that lazy loading of a command works."""
    with patch("importlib.import_module") as mock_import_module:
        mock_command = MagicMock()
        mock_import_module.return_value.run = mock_command

        cmd = lazy_default_group.get_command(Context(lazy_default_group), "run")

        assert cmd == mock_command
        mock_import_module.assert_called_once_with("kedro_viz.launchers.cli.run")


def test_list_commands(lazy_default_group):
    """Test that the list of commands is correctly returned."""
    commands = lazy_default_group.list_commands(Context(lazy_default_group))
    assert commands == ["build", "run"]


def test_default_command_if_no_args(lazy_default_group):
    """Test that the default command is invoked when no args are passed."""
    ctx = Context(lazy_default_group)
    args = []

    lazy_default_group.parse_args(ctx, args)

    # Assert that the default command is used
    assert args == ["build"]


def test_resolve_command_with_valid_command(lazy_default_group):
    """Test resolving a valid command."""
    ctx = Context(lazy_default_group)
    cmd_name, cmd, args = lazy_default_group.resolve_command(ctx, ["run"])
    assert cmd_name == "run"
    assert cmd is not None


def test_resolve_command_with_invalid_command(lazy_default_group):
    """Test resolving an invalid command falls back to default."""
    ctx = Context(lazy_default_group)

    # When an invalid command is given, the default command should be used
    cmd_name, cmd, args = lazy_default_group.resolve_command(ctx, ["invalid"])
    assert cmd_name == "build"
    assert cmd is not None


def test_resolve_command_raises_usage_error_when_no_default(lazy_default_group):
    """Test that UsageError is raised when an invalid command is given and no default is set."""
    lazy_default_group.default_cmd_name = None  # Remove the default command

    ctx = Context(lazy_default_group)
    with pytest.raises(UsageError):
        lazy_default_group.resolve_command(ctx, ["invalid"])


def test_init_raises_value_error_on_ignore_unknown_options():
    """Test that ValueError is raised when ignore_unknown_options is False."""
    with pytest.raises(ValueError):
        LazyDefaultGroup(ignore_unknown_options=False)
