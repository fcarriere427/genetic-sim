/**
 * Classe gérant la communication avec le serveur
 * pour la simulation d'algorithmes génétiques
 */
class SimulationClient {
  constructor() {

    // Déterminer l'URL de base pour Socket.IO et les API
    this.apiPrefix = window.location.pathname.startsWith('/genetic') ? '/genetic' : '';
    const socketPath = this.apiPrefix + '/socket.io';

    // Vérifier que io est défini avant de l'utiliser
    if (typeof io === 'undefined') {
      console.error('Socket.IO n\'est pas chargé. Vérifiez la connexion au réseau ou le chargement de la bibliothèque.');
      return;
    }
    
    // !!! Déterminer l'URL de base pour Socket.IO = dépend de la configuration NGINX
    const path = window.location.pathname.startsWith('/genetic') ? '/genetic/socket.io' : '/socket.io';
  
    // Connexion Socket.IO - définir explicitement l'URL du serveur local
    this.socket = io(window.location.origin, {
      path: path,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['polling', 'websocket'],
      forceNew: true
    });
    console.log("Tentative de connexion Socket.IO à:", window.location.origin, "avec path:", path);
        
    // Fonction de rappel pour les mises à jour
    this.onUpdateCallback = null;
    
    // État actuel de la simulation
    this.simulationState = null;
    
    // Historique des simulations
    this.simulationHistory = [];
    
    // Graphique d'évolution de fitness
    this.fitnessChart = null;
    this.fitnessData = {
      generations: [],
      bestFitness: [],
      avgFitness: []
    };
    
    // Initialiser les écouteurs d'événements
    this.initSocketListeners();
  }
  
  /**
   * Initialise les écouteurs d'événements Socket.IO
   */
  initSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connecté au serveur Socket.IO');
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Erreur de connexion Socket.IO:', error);
      // Tenter de recréer le socket après un délai
      setTimeout(() => {
        console.log('Tentative de reconnexion...');
        this.socket.connect();
      }, 3000);
    });

    this.socket.on('heartbeat', (data) => {
      console.log('Heartbeat reçu:', data.timestamp);
      // Répondre au heartbeat
      this.socket.emit('heartbeat-response', { timestamp: Date.now() });
    });
    
    this.socket.on('simulation-update', (state) => {
      console.log('Mise à jour de simulation reçue:', state.generation);
      this.simulationState = state;
      
      // Mise à jour des données de graphique
      if (this.fitnessData.generations.indexOf(state.generation) === -1) {
        this.fitnessData.generations.push(state.generation);
        this.fitnessData.bestFitness.push(state.statistics.bestFitness);
        this.fitnessData.avgFitness.push(state.statistics.averageFitness);
        
        this.updateChart();
      }
      
      // Appeler le callback s'il est défini
      if (this.onUpdateCallback) {
        this.onUpdateCallback(state);
      }
    });
    
    this.socket.on('disconnect', () => {
      console.log('Déconnecté du serveur Socket.IO');
    });
  }
  
  /**
   * Démarre une nouvelle simulation
   * @param {Object} config - Configuration de la simulation
   */
  startSimulation(config) {
    console.log('Demande de démarrage de simulation avec config:', config);
    this.simulationState = null;
    this.fitnessData = {
      generations: [],
      bestFitness: [],
      avgFitness: []
    };
    
    this.socket.emit('start-simulation', config);
  }
  
  /**
   * Mettre en pause ou reprendre la simulation
   * @param {boolean} isPaused - État de pause
   */
  togglePause(isPaused) {
    console.log('Basculement pause:', isPaused);
    this.socket.emit('toggle-pause', isPaused);
  }
  
  /**
   * Définir la vitesse de la simulation
   * @param {number} speed - Multiplicateur de vitesse
   */
  setSpeed(speed) {
    this.socket.emit('set-speed', speed);
  }
  
  /**
   * Définir la fonction de rappel pour les mises à jour
   * @param {Function} callback - Fonction à appeler lors des mises à jour
   */
  onUpdate(callback) {
    this.onUpdateCallback = callback;
  }
  
  /**
   * Charger l'historique des simulations depuis le serveur
   */
  async loadSimulationHistory() {
    try {
      const url = `${this.apiPrefix}/api/simulations`;
      console.log('Chargement de l\'historique depuis:', url);
      const response = await fetch(url);
    
      if (!response.ok) {
        console.warn('Réponse non-OK du serveur:', response.status);
        return [];
      }
      
      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Réponse non-JSON reçue:', contentType);
        return [];
      }
      
      this.simulationHistory = await response.json();
      console.log('Historique chargé avec succès:', this.simulationHistory);
      return this.simulationHistory;
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      return [];
    }
  }


  /**
   * Sauvegarder la simulation actuelle
   * @param {string} name - Nom de la simulation
   */
  async saveSimulation(name) {
    if (!this.simulationState) {
      console.warn('Impossible de sauvegarder: pas de simulation active');
      return null;
    }
    
    try {
      const url = `${this.apiPrefix}/api/simulations`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          data: this.simulationState.config || {}
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Simulation sauvegardée avec ID:', result.id);
      return result.id;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return null;
    }
  }
  
  /**
   * Initialiser le graphique d'évolution de fitness
   */
  initChart() {
    const ctx = document.getElementById('fitnessChart').getContext('2d');
    
    this.fitnessChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Meilleur Fitness',
            data: [],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 2,
            tension: 0.1
          },
          {
            label: 'Fitness Moyen',
            data: [],
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            borderWidth: 2,
            tension: 0.1
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        },
        animation: {
          duration: 0
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  /**
   * Mettre à jour le graphique avec les données actuelles
   */
  updateChart() {
    if (!this.fitnessChart) {
      this.initChart();
    }
    
    this.fitnessChart.data.labels = this.fitnessData.generations;
    this.fitnessChart.data.datasets[0].data = this.fitnessData.bestFitness;
    this.fitnessChart.data.datasets[1].data = this.fitnessData.avgFitness;
    
    this.fitnessChart.update();
  }
}
