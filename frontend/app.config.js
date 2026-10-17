/**
 * WORKLY app variants stay isolated on the same Android device.
 * EAS preview builds use pt.workly.app.beta; production retains pt.workly.app.
 * Keep Expo ownership / EAS project ID in app.json.
 */
export default ({ config }) => {
  const variant = process.env.APP_VARIANT;
  const isBeta = variant === "preview" || variant === "development";
  const suffix = variant === "development" ? ".dev" : ".beta";
  return {
    ...config,
    name: isBeta ? (variant === "development" ? "WORKLY Dev" : "WORKLY Beta") : config.name,
    android: {
      ...config.android,
      package: isBeta ? `pt.workly.app${suffix}` : config.android?.package,
    },
    ios: {
      ...config.ios,
      bundleIdentifier: isBeta ? `pt.workly.app${suffix}` : config.ios?.bundleIdentifier,
    },
  };
};
