export const Flags = {
  config: {
    newgraph: {
      description: 'Improved graphing algorithm',
      default: false,
      icon: '📈'
    }
  },
  isDefined: name => Flags.names().includes(name),
  names: () => Object.keys(Flags.config),
  defaults: () =>
    Flags.names().reduce(
      (result, flag) => Object.assign(result, { [flag]: flag.default }),
      {}
    )
};

export const getFlagsFromUrl = () => {
  const urlParams = new URL(document.location).searchParams;
  const enableNames = (urlParams.get('enable') || '').split(/\W/g);
  const disableNames = (urlParams.get('disable') || '').split(/\W/g);
  const flags = {};

  enableNames.forEach(name =>
    Flags.isDefined(name) ? (flags[name] = true) : null
  );
  disableNames.forEach(name =>
    Flags.isDefined(name) ? (flags[name] = false) : null
  );

  return flags;
};

export const getFlagsMessage = flags => {
  const names = Flags.names();

  if (names.length > 0) {
    let info = 'Experimental features 🏄‍♂️\n';

    names.forEach(name => {
      const isEnabled = flags[name];
      const status = isEnabled ? 'Enabled' : 'Disabled';
      const statusIcon = isEnabled ? '🟢' : '⚪️';
      const icon = Flags.config[name].icon;
      const description = Flags.config[name].description;
      info += `\n${statusIcon} ${icon} "${name}" · ${description} · ${status}`;
    });

    info += `\n\nSee docs for more info 📖`;

    return info;
  }
};
