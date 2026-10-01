const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname]; // watch current project
// The monorepo's `../../packages` watch folder is intentionally gone: shared
// types/constants are vendored into `src/shared`, and Metro hard-fails the
// release bundle if a watchFolder does not exist.

module.exports = withNativeWind(config, { input: './src/global.css' });