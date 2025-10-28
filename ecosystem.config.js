module.exports = {
  apps: [
    {
      name: 'meenaBack', // Nom lisible dans "pm2 list"
      script: 'dist/server.js', // Fichier compilé à exécuter
      exec_mode: 'cluster', // "cluster" pour profiter de tous les cœurs CPU
      instances: 2, // Nombre de processus (tu peux mettre "max" pour tous les CPU)
      instance_var: 'INSTANCE_ID', // utile pour différencier les instances
      autorestart: true, // Redémarre automatiquement si crash
      watch: false, // Ne redémarre pas sur changement de fichiers
      ignore_watch: ['node_modules', 'logs'], // Répertoires ignorés
      max_memory_restart: '1G', // Redémarre si dépasse 1 Go de RAM
      merge_logs: true, // Fusionne stdout/stderr
      output: './logs/access.log', // Logs standards
      error: './logs/error.log', // Logs erreurs
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
