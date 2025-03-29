/**
 * Classe contrôlant l'interface utilisateur
 * Gère les interactions avec les boutons, formulaires, etc.
 */
class UIController {
  constructor(simulationClient, renderer) {
    this.simulationClient = simulationClient;
    this.renderer = renderer;
    this.isRunning = false;
    this.isPaused = false;
    
    // Éléments d'interface
    this.startButton = document.getElementById('startButton');
    this.pauseButton = document.getElementById('pauseButton');
    this.resetButton = document.getElementById('resetButton');
    this.speedSlider = document.getElementById('speedSlider');
    this.speedValue = document.getElementById('speedValue');
    this.configForm = document.getElementById('configForm');
    this.mutationRateSlider = document.getElementById('mutationRate');
    this.mutationRateValue = document.getElementById('mutationRateValue');
    // Éléments d'affichage des statistiques
    this.generationValue = document.getElementById('generationValue');
    this.populationValue = document.getElementById('populationValue');
    this.bestFitnessValue = document.getElementById('bestFitnessValue');
    this.avgFitnessValue = document.getElementById('avgFitnessValue');
    
    // Initialiser les écouteurs d'événements
    this.initEventListeners();
  }
  
  /**
   * Initialise les écouteurs d'événements pour l'interface
   */
  initEventListeners() {
    // Bouton Démarrer
    this.startButton.addEventListener('click', () => {
      if (!this.isRunning) {
        this.startSimulation();
      } else {
        this.resumeSimulation();
      }
    });
    
    // Bouton Pause
    this.pauseButton.addEventListener('click', () => {
      this.pauseSimulation();
    });
    
    // Bouton Réinitialiser
    this.resetButton.addEventListener('click', () => {
      this.resetSimulation();
    });
    
    // Curseur de vitesse
    this.speedSlider.addEventListener('input', () => {
      const speed = parseFloat(this.speedSlider.value);
      this.speedValue.textContent = speed.toFixed(1) + 'x';
      this.simulationClient.setSpeed(speed);
    });
    
    // Curseur de taux de mutation
    this.mutationRateSlider.addEventListener('input', () => {
      const rate = parseFloat(this.mutationRateSlider.value);
      this.mutationRateValue.textContent = Math.round(rate * 100) + '%';
    });
    
    // Formulaire de configuration
    this.configForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.isRunning) {
        this.resetSimulation();
      }
      this.startSimulation();
    });
    
    // Écouteur pour les mises à jour de simulation
    this.simulationClient.onUpdate((state) => {
      this.updateStats(state);
      this.renderer.render(state);
    });
  }
  
  /**
   * Démarre une nouvelle simulation
   */
  startSimulation() {
    // Récupérer la configuration depuis le formulaire
    const config = {
      populationSize: parseInt(document.getElementById('populationSize').value),
      mutationRate: parseFloat(document.getElementById('mutationRate').value),
      foodAmount: parseInt(document.getElementById('foodAmount').value),
      obstacleAmount: parseInt(document.getElementById('obstacleAmount').value),
      environmentWidth: this.renderer.canvas.width,
      environmentHeight: this.renderer.canvas.height
    };
    
    // Démarrer la simulation
    this.simulationClient.startSimulation(config);
    
    // Mettre à jour l'interface
    this.isRunning = true;
    this.isPaused = false;
    this.startButton.textContent = 'Reprendre';
    this.startButton.disabled = true;
    this.pauseButton.disabled = false;
  }
  
  /**
   * Met en pause la simulation
   */
  pauseSimulation() {
    this.simulationClient.togglePause(true);
    
    this.isPaused = true;
    this.startButton.disabled = false;
    this.pauseButton.disabled = true;
  }
  
  /**
   * Reprend la simulation après une pause
   */
  resumeSimulation() {
    this.simulationClient.togglePause(false);
    
    this.isPaused = false;
    this.startButton.disabled = true;
    this.pauseButton.disabled = false;
  }
  
  /**
   * Réinitialise la simulation
   */
  resetSimulation() {
    // Mettre à jour l'interface
    this.isRunning = false;
    this.isPaused = false;
    this.startButton.textContent = 'Démarrer';
    this.startButton.disabled = false;
    this.pauseButton.disabled = true;
    
    // Effacer le canvas
    this.renderer.clear();
    
    // Réinitialiser les statistiques
    this.updateStats({
      generation: 0,
      population: [],
      statistics: {
        bestFitness: 0,
        averageFitness: 0
      }
    });
  }
  
  /**
   * Met à jour l'affichage des statistiques
   */
  updateStats(state) {
    if (!state) return;
    
    this.generationValue.textContent = state.generation;
    this.populationValue.textContent = state.population.length;
    
    if (state.statistics) {
      this.bestFitnessValue.textContent = Math.round(state.statistics.bestFitness);
      this.avgFitnessValue.textContent = Math.round(state.statistics.averageFitness);
    }
  }
  
  // Fonctionalités de chargement et sauvegarde de simulation supprimées
}
