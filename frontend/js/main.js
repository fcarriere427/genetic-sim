/**
 * Point d'entrée principal de l'application client
 * Initialise les différentes classes et démarre l'application
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialiser le client de simulation
  const simulationClient = new SimulationClient();
  
  // Initialiser le moteur de rendu
  const renderer = new SimulationRenderer('simulationCanvas');
  
  // Initialiser le contrôleur d'interface
  const uiController = new UIController(simulationClient, renderer);
  
  // Log de démarrage
  console.log('Application de simulation d\'algorithmes génétiques démarrée');
});
