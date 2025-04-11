// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add additional exclusions for web platform
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Exclude react-native-maps from web bundle
config.resolver.blockList = config.resolver.blockList || [];
// Make sure blockList is an array
if (!Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList = [];
}
// Add react-native-maps to the blockList
config.resolver.blockList.push(
  new RegExp(path.resolve(__dirname, 'node_modules/react-native-maps/.*'))
);

// Add platform-specific extensions
config.resolver.sourceExts = process.env.EXPO_PUBLIC_PLATFORM === 'web' 
  ? ['web.tsx', 'web.ts', 'web.jsx', 'web.js', 'tsx', 'ts', 'jsx', 'js', 'json', 'wasm', 'mjs']
  : ['tsx', 'ts', 'jsx', 'js', 'json', 'wasm', 'mjs'];

module.exports = config;