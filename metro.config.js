const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// NOTE: this file previously set `config.resolver.unstable_enablePackageExports = false`
// as a workaround for zustand. That setting breaks React Native 0.88 (Expo SDK 58),
// which now relies on package "exports" to resolve internal modules such as
// "react-native/react-private-interface" (bundling fails with "Unable to resolve").
// It is no longer needed: zustand 4.x ships a "react-native" export condition that
// points to its CommonJS build, so the default Metro behaviour resolves it correctly.

module.exports = config;
