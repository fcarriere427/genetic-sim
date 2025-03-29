#!/bin/bash

# Script de démarrage du simulateur d'algorithmes génétiques sur Raspberry Pi

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé. Installation..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Vérifier la version de Node.js
NODE_VERSION=$(node -v)
echo "Utilisation de Node.js $NODE_VERSION"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances..."
    npm install
fi

# Créer le répertoire de base de données s'il n'existe pas
if [ ! -d "database/data" ]; then
    echo "Création du répertoire de base de données..."
    mkdir -p database/data
fi

# Optimisations pour Raspberry Pi
echo "Application des optimisations pour Raspberry Pi..."

# Déterminer le modèle de Raspberry Pi
PI_MODEL=$(cat /proc/device-tree/model | tr -d '\0')
PI_VERSION=$(echo $PI_MODEL | grep -o 'Raspberry Pi [0-9]' | grep -o '[0-9]')

# Ajuster les paramètres en fonction du modèle
if [ "$PI_VERSION" -le "3" ]; then
    # Pour Raspberry Pi 3 ou inférieur, réduire les paramètres par défaut
    export MAX_POPULATION=15
    export RENDER_INTERVAL=200
    export LOW_PERFORMANCE=true
    echo "Mode performance réduite activé pour $PI_MODEL"
else
    # Pour Raspberry Pi 4 ou supérieur, paramètres standard
    export MAX_POPULATION=30
    export RENDER_INTERVAL=100
    export LOW_PERFORMANCE=false
    echo "Mode performance standard activé pour $PI_MODEL"
fi

# Déterminer la RAM disponible
TOTAL_MEMORY=$(free -m | awk '/^Mem:/{print $2}')
echo "Mémoire RAM totale: $TOTAL_MEMORY MB"

# Si RAM limitée, activer le mode basse consommation
if [ "$TOTAL_MEMORY" -lt "2000" ]; then
    echo "RAM limitée détectée, activation du mode économie de mémoire"
    export NODE_OPTIONS="--max-old-space-size=384"
fi

# Démarrer le serveur
echo "Démarrage du simulateur d'algorithmes génétiques..."
echo "Accès à l'interface: http://localhost:3000"
echo "Ou depuis un autre appareil: http://$(hostname -I | awk '{print $1}'):3000"
echo "-------------------------------------------"
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo "-------------------------------------------"

# Exécuter le serveur
node backend/server.js

# En cas d'erreur
if [ $? -ne 0 ]; then
    echo "Une erreur s'est produite lors du démarrage du serveur."
    echo "Vérifiez les journaux pour plus d'informations."
fi
