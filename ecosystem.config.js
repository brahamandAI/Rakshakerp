module.exports = {
  apps: [
    {
      name: 'employee-onboarding-portal',
      cwd: '.',
      // Guarded start — refuses to boot without a finished `next build`
      script: 'scripts/start-prod.js',
      interpreter: 'node',
      node_args: '--max-old-space-size=768',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
      restart_delay: 5000,
      exp_backoff_restart_delay: 200,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      kill_timeout: 5000,
      listen_timeout: 30000,
      watch: false,
    },
  ],
};
