// This file did not exist anywhere in the project (no babel.config.js,
// .babelrc, or "babel" field in package.json). It's required for
// jest-expo's Babel transform, and is the standard config every Expo
// project is scaffolded with - Metro itself also resolves project babel
// config through the normal @babel/core config search, so if this was
// genuinely absent (rather than just excluded from whatever export
// produced the uploaded project) it's worth confirming this matches
// what's on disk in your actual working copy.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
