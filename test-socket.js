const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Création de l'app Express
const app = express();

// Création du serveur HTTP
const server = http.createServer(app);

// Initialisation de Socket.IO
const io = socketIo(server);

// Route de test
app.get('/', (req, res) => {
  res.send('Test Socket.IO Server');
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Client connecté!');
  
  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});

// Démarrage du serveur
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Serveur de test démarré sur le port ${PORT}`);
});