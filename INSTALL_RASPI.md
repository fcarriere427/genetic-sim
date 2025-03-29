# Guide d'installation sur Raspberry Pi

Ce guide vous explique comment installer et exécuter le simulateur d'algorithmes génétiques sur un Raspberry Pi.

## Prérequis

- Raspberry Pi 3 ou supérieur (recommandé pour de meilleures performances)
- Système d'exploitation Raspberry Pi OS (anciennement Raspbian) à jour
- Connexion Internet pour installer les dépendances

## Étape 1 : Préparation du Raspberry Pi

Commencez par mettre à jour votre système :

```bash
sudo apt update
sudo apt upgrade -y
```

Installez Node.js et npm (gestionnaire de paquets de Node.js) :

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs
```

Vérifiez que Node.js et npm sont correctement installés :

```bash
node -v  # Devrait afficher v16.x.x
npm -v   # Devrait afficher la version de npm
```

## Étape 2 : Installation du simulateur

Clonez le dépôt (si vous utilisez git) ou copiez les fichiers sur votre Raspberry Pi.

### Option 1 : Cloner le dépôt

```bash
git clone https://github.com/votre-pseudo/genetic-sim.git
cd genetic-sim
```

### Option 2 : Transfert manuel

1. Transférez les fichiers sur votre Raspberry Pi à l'aide de SCP, SFTP ou en copiant sur une clé USB
2. Décompressez l'archive si nécessaire et naviguez dans le répertoire

```bash
cd chemin/vers/genetic-sim
```

## Étape 3 : Installation des dépendances

Une fois dans le répertoire du projet, installez les dépendances :

```bash
npm install
```

Cette étape peut prendre plusieurs minutes sur un Raspberry Pi.

## Étape 4 : Configuration du serveur

Vous pouvez modifier le port d'écoute du serveur si nécessaire. Par défaut, le serveur écoute sur le port 3000.

Pour modifier le port, éditez la variable `PORT` dans le fichier `backend/server.js` ou configurez une variable d'environnement :

```bash
export PORT=8080  # Remplacez 8080 par le port de votre choix
```

## Étape 5 : Lancement du serveur

Démarrez le serveur :

```bash
npm start
```

Vous devriez voir un message indiquant que le serveur est en cours d'exécution sur le port spécifié.

## Étape 6 : Accès à l'interface

Ouvrez un navigateur web sur le Raspberry Pi ou sur un autre ordinateur du même réseau et accédez à l'URL suivante :

- Depuis le Raspberry Pi : `http://localhost:3000`
- Depuis un autre appareil : `http://IP_DU_RASPBERRY:3000` (remplacez `IP_DU_RASPBERRY` par l'adresse IP de votre Raspberry Pi)

Pour trouver l'adresse IP de votre Raspberry Pi, exécutez la commande suivante :

```bash
hostname -I
```

## Exécution en arrière-plan

Pour exécuter le serveur en arrière-plan, même après la fermeture de la session SSH, vous pouvez utiliser `pm2` :

```bash
# Installation de PM2
sudo npm install -g pm2

# Démarrage du serveur avec PM2
pm2 start backend/server.js --name genetic-sim

# Configuration du démarrage automatique au boot
pm2 startup
# Suivez les instructions affichées à l'écran
pm2 save
```

## Optimisation des performances

Le Raspberry Pi ayant des ressources limitées, voici quelques conseils pour optimiser les performances :

1. Réduisez la taille de la population et le nombre d'obstacles/nourriture
2. Augmentez l'intervalle de mise à jour de la simulation (dans `backend/server.js`, augmentez la valeur du `setInterval`)
3. Fermez les applications inutilisées sur le Raspberry Pi
4. Si vous utilisez un Raspberry Pi 4 avec plusieurs cœurs, vous pouvez envisager d'utiliser un module comme `cluster` pour répartir la charge

## Résolution des problèmes

### Le serveur ne démarre pas

- Vérifiez que le port n'est pas déjà utilisé par une autre application
- Assurez-vous que Node.js est correctement installé
- Vérifiez les messages d'erreur dans la console

### L'interface est lente

- Réduisez les paramètres de simulation (taille de population, nourriture, etc.)
- Utilisez un navigateur léger comme Chromium
- Si vous accédez à distance, essayez depuis le Raspberry Pi directement

### Erreurs de base de données

- Vérifiez les permissions du répertoire `database`
- Assurez-vous que SQLite3 est correctement installé (`sudo apt install sqlite3`)
