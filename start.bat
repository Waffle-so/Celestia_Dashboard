@echo off
title Celestia Servers

echo Lancement du Backend...
start "Backend (Express)" cmd /k "cd Backend && npm run dev"

echo Lancement du Frontend...
start "Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo Les serveurs sont en cours de lancement ! Vous pouvez fermer cette fenetre.
