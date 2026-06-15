#!/bin/bash
set -e

HOST="root@89.167.91.113"
KEY="~/.ssh/server_key"
DIR="/var/www/foryou-app"

echo "Syncing files..."
rsync -avz --delete -e "ssh -i $KEY" --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '.DS_Store' --exclude 'setup_ssh.exp' --exclude 'deploy.sh' ./ $HOST:$DIR

echo "Building and restarting on server..."
ssh -i $KEY $HOST "cd $DIR && npm install --legacy-peer-deps && npm run build && pm2 restart foryou-app"

echo "Deployment complete!"
