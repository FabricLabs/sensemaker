module.exports = {
  apps: [
    {
      name: 'sensemaker',
      script: 'scripts/node.js',
      instances: 1, // Number of instances to run
      exec_mode: 'cluster', // Use cluster mode for better performance
      watch: false, // Enable file watch and auto-restart
      max_restarts: 10, // Maximum restarts within 1 minute
      min_uptime: 10000, // Minimum uptime before restarting (in milliseconds)
      autorestart: true, // Enable automatic restarts
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
