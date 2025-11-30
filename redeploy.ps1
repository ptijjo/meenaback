# Script de redéploiement pour VPS production

Write-Host "🔨 Compilation du projet..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Échec de la compilation" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Compilation réussie" -ForegroundColor Green

Write-Host "🔄 Arrêt de l'instance PM2..." -ForegroundColor Cyan
pm2 stop meenaBack

Write-Host "🗑️ Suppression de l'ancienne instance..." -ForegroundColor Cyan
pm2 delete meenaBack

Write-Host "🚀 Démarrage de la nouvelle instance..." -ForegroundColor Cyan
pm2 start dist/server.js --name meenaBack --env production

Write-Host "📋 Affichage des logs (Ctrl+C pour quitter)..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
pm2 logs meenaBack --lines 50
