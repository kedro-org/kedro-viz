"""`kedro_viz.launchers.cli.lazy_group` provides a custom mutli-command
subclass for a lazy subcommand loader"""
# pylint: disable=import-outside-toplevel
from typing import Any, Union

import click


class LazyGroup(click.Group):
    """A click Group that supports lazy loading of subcommands."""

    def __init__(
        self,
        *args: Any,
        lazy_subcommands: Union[dict[str, str], None] = None,
        **kwargs: Any,
    ):
        super().__init__(*args, **kwargs)
        # lazy_subcommands is a map of the form:
        #
        #   {command-name} -> {module-name}.{command-object-name}
        #
        self.lazy_subcommands = lazy_subcommands or {}

    def list_commands(self, ctx: click.Context) -> list[str]:
        lazy = sorted(self.lazy_subcommands.keys())
        return lazy

    def get_command(  # type: ignore[override]
        self, ctx: click.Context, cmd_name: str
    ) -> Union[click.BaseCommand, click.Command, None]:
        if cmd_name in self.lazy_subcommands:
            return self._lazy_load(cmd_name)
        return super().get_command(ctx, cmd_name)

    def _lazy_load(self, cmd_name: str) -> click.BaseCommand:
        from importlib import import_module

        # lazily loading a command, first get the module name and attribute name
        import_path = self.lazy_subcommands[cmd_name]
        modname, cmd_object_name = import_path.rsplit(".", 1)

        # do the import
        mod = import_module(modname)

        # get the Command object from that module
        cmd_object = getattr(mod, cmd_object_name)

        return cmd_object
