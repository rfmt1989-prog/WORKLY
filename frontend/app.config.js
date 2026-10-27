/**
 * WORKLY app variants stay isolated on the same Android device.
 * EAS preview builds use pt.workly.app.beta; production retains pt.workly.app.
 * Keep Expo ownership / EAS project ID in app.json.
 */
export default ({ config }) => {
  if (process.env.EAS_BUILD_PROFILE === "play-internal") {
    const raw = process.env.EXPO_PUBLIC_API_URL || "";
    let api;
    try { api = new URL(raw); } catch { /* Report a configuration error below. */ }
    if (
      !api || api.protocol !== "https:" || !api.pathname.endsWith("/api") ||
      api.username || api.password || api.search || api.hash ||
      ["localhost", "127.0.0.1", "[::1]", "workly-demo.vercel.app", "workly-demo-rfmt1989-8687s-projects.vercel.app"].includes(api.hostname)
    ) {
      throw new Error("Configure EXPO_PUBLIC_API_URL with the reviewed HTTPS test API ending in /api before building play-internal. Production aliases and local APIs are not accepted.");
    }
  }
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
