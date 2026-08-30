// Backend/ecosystem.config.cjs
//
// PM2 cluster configuration for the RepoFlow backend.
// In cluster mode PM2 spawns one Node.js worker per CPU core, so a single
// EC2 instance uses all cores instead of idling on one process.
//
// Usage:
//   npm run pm2          # start (or reload) the cluster
//   npx pm2 status       # see workers
//   npx pm2 logs         # stream logs
//   npx pm2 save         # persist the process list
//   npx pm2 startup      # run once on EC2 so the cluster survives reboots
//
// Secrets are NOT defined here. The app loads them itself from Backend/.env
// via dotenv, so this file is safe to commit.
module.exports = {
  apps: [
    {
      name: "repoflow-backend",
      script: "index.js",
      cwd: __dirname,
      instances: "max", // one worker per CPU core
      exec_mode: "cluster",
      autorestart: true,
      max_memory_restart: "500M",
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};