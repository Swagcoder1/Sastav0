const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .env files
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

module.exports = config;