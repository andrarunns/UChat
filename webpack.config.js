const path = require('path');

module.exports = {
  entry: {
    login: './src/index.js',   // Entry point for login page
    dashboard: './dashboard/dashboard.js',  // Entry point for dashboard page
    notifiations: './notifications/notifications.js'
  },
  output: {
    filename: '[name].bundle.js',  // This will create 'login.bundle.js' and 'dashboard.bundle.js'
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',  // Change to 'production' for production builds
};
