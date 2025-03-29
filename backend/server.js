const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const dbManager = require('../database/db-manager');
const simulationEngine = require('./simulation-engine');

// Déterminer si on est en production (derrière proxy nginx)
const isProduction = process.env.NODE_ENV === 'production';

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  path: isProduction ? '/genetic/socket.io' : '/socket.io',
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

// API pour obtenir les résultats des simulations précédentes
app.get('/api/simulations', async (req, res) => {
  try {
    const simulations = await dbManager.getSimulations();
    res.json(simulations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API pour sauvegarder une simulation
app.post('/api/simulations', async (req, res) => {
  try {
    const { name, data } = req.body;
    const id = await dbManager.saveSimulation(name, data);
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Nouveau client connecté');
  
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

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  dbManager.initDatabase();
});
