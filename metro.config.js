// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

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

// Fix Firebase dependencies resolution
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // Add explicit resolution for idb and other Firebase dependencies
  'idb': path.resolve(__dirname, 'node_modules/idb'),
  '@firebase/app': path.resolve(__dirname, 'node_modules/@firebase/app'),
  '@firebase/auth': path.resolve(__dirname, 'node_modules/@firebase/auth'),
  '@firebase/firestore': path.resolve(__dirname, 'node_modules/@firebase/firestore'),
  '@firebase/storage': path.resolve(__dirname, 'node_modules/@firebase/storage'),
  '@firebase/analytics': path.resolve(__dirname, 'node_modules/@firebase/analytics'),
};

// Add symlinks for node_modules resolution
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Add additional assetExts for Firebase
config.resolver.assetExts = [...config.resolver.assetExts, 'cjs'];

module.exports = config;