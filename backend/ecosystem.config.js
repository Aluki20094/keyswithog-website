module.exports = {
  apps: [
    {
      name: 'keys-with-og-backend',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      restart_delay: 4000,
      // Health check
      health_check_url: 'http://localhost:3000/health',
      health_check_grace_period: 3000,
      // Environment variables (these will be overridden by .env file)
      env_vars: [
        'DATABASE_URL',
        'GMAIL_EMAIL',
        'GMAIL_PASSWORD',
        'CLAUDE_API_KEY',
        'ADMIN_PASSWORD',
        'NODE_ENV',
        'PORT'
      ]
    }
  ]
};