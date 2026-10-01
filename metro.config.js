const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname]; // watch current project
config.watchFolders.push(require('path').resolve(__dirname, '../../packages'));

module.exports = withNativeWind(config, { input: './src/global.css' });