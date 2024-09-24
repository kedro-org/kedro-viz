"""`kedro_viz.launchers.cli.lazy_default_group` provides a custom mutli-command
subclass for a lazy subcommand loader"""

# pylint: disable=import-outside-toplevel
from typing import Any, Union

import click


class LazyDefaultGroup(click.Group):
    """A click Group that supports lazy loading of subcommands and a default command"""

    def __init__(
        self,
        *args: Any,
        **kwargs: Any,
    ):
        if not kwargs.get("ignore_unknown_options", True):
            raise ValueError("Default group accepts unknown options")
        self.ignore_unknown_options = True

        # lazy_subcommands is a map of the form:
        #
        #   {command-name} -> {module-name}.{command-object-name}
        #
        self.lazy_subcommands = kwargs.pop("lazy_subcommands", {})

        self.default_cmd_name = kwargs.pop("default", None)
        self.default_if_no_args = kwargs.pop("default_if_no_args", False)

        super().__init__(*args, **kwargs)

    def list_commands(self, ctx: click.Context) -> list[str]:
        return sorted(self.lazy_subcommands.keys())

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

    def parse_args(self, ctx, args):
        # If no args are provided and default_command_name is specified,
        # use the default command
        if not args and self.default_if_no_args:
            args.insert(0, self.default_cmd_name)
        return super().parse_args(ctx, args)

    def resolve_command(self, ctx: click.Context, args):
        # Attempt to resolve the command using the parent class method
        try:
            cmd_name, cmd, args = super().resolve_command(ctx, args)
            return cmd_name, cmd, args
        except click.UsageError as exc:
            if self.default_cmd_name and not ctx.invoked_subcommand:
                # No command found, use the default command
                default_cmd = self.get_command(ctx, self.default_cmd_name)
                if default_cmd:
                    return default_cmd.name, default_cmd, args
            raise exc
