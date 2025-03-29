const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const simulationEngine = require('./simulation-engine');

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  path: '/genetic/socket.io',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Routes API supprimées - fonctionnalité de sauvegarde non requise

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Nouveau client connecté:', socket.id);

  // Déconnecter les clients inactifs après 5 minutes
  const activityTimeout = setTimeout(() => {
    console.log('Client inactif déconnecté:', socket.id);
    socket.disconnect(true);
  }, 5 * 60 * 1000);

   // Réinitialiser le timeout à chaque activité
   socket.on('any-event', () => {
    clearTimeout(activityTimeout);
    // Redémarrer le timer
    activityTimeout = setTimeout(() => {
      socket.disconnect(true);
    }, 5 * 60 * 1000);
  });

  // Démarrer la simulation
  socket.on('start-simulation', (config) => {
    console.log('Démarrage de la simulation avec config:', config);
    
    // Initialiser le moteur de simulation
    const simulation = simulationEngine.createSimulation(config);
    
    // Envoyer les mises à jour régulièrement
    const intervalId = setInterval(() => {
      const state = simulationEngine.updateSimulation(simulation);
      socket.emit('simulation-update', state);
      
      // Arrêter si la simulation est terminée
      if (state.isFinished) {
        clearInterval(intervalId);
      }
    }, 100); // Mise à jour 10 fois par seconde
    
    // Arrêter la simulation si le client se déconnecte
    socket.on('disconnect', () => {
      clearInterval(intervalId);
    });
  });
  
  // Pause/Reprise de la simulation
  socket.on('toggle-pause', (isPaused) => {
    simulationEngine.togglePause(isPaused);
  });
  
  // Ajustement de la vitesse de simulation
  socket.on('set-speed', (speed) => {
    simulationEngine.setSimulationSpeed(speed);
  });
  
  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});

// Envoyer un heartbeat toutes les 30 secondes pour maintenir les connexions actives
setInterval(() => {
  io.emit('heartbeat', { timestamp: Date.now() });
  console.log('Heartbeat envoyé à', io.engine.clientsCount, 'clients');
}, 30000);

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
