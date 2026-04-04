// PM2 ecosystem config for the Astro SSR server.
// Copy .env.example to .env and fill in values before deploying.

export default {
  apps: [
    {
      name: "pers",
      script: "./dist/server/entry.mjs",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      cwd: "/home/nick/Documents/Github/pers",

      // Load .env from the project root
      env_file: ".env",

      // Fallback env in case .env is missing
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: "4393",
        ORIGIN: "https://link.nickcardoso.com",
      },

      // Restart behaviour
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,

      // Logging
      out_file: "/home/nick/Documents/Github/pers/logs/out.log",
      error_file: "/home/nick/Documents/Github/pers/logs/error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
