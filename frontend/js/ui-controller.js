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
    
    // Mettre à jour les informations des champions
    this.updateChampionInfo(state);
  }
  
  /**
   * Met à jour les informations des champions dans l'interface
   */
  updateChampionInfo(state) {
    const { allTimeBestOrganism, currentBestOrganism } = state;
    
    // S'il n'y a pas de champions, ne rien faire
    if (!allTimeBestOrganism && !currentBestOrganism) return;
    
    // Chercher ou créer le conteneur pour les champions
    let champContainer = document.getElementById('championInfo');
    if (!champContainer) {
      // Créer le conteneur pour les champions s'il n'existe pas
      const statsContainer = document.querySelector('.stats-container');
      champContainer = document.createElement('div');
      champContainer.id = 'championInfo';
      champContainer.className = 'champion-info';
      statsContainer.appendChild(champContainer);
      
      // Appliquer un style
      const style = document.createElement('style');
      style.textContent = `
        .champion-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #ddd;
        }
        .champion-card {
          background-color: #2c3e50;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          position: relative;
        }
        .champion-title {
          font-weight: bold;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          color: #ffffff; /* Texte en blanc pour meilleure lisibilité */
        }
        .champion-color {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 5px;
        }
        .champion-star {
          margin-left: 5px;
          color: gold;
        }
        .champion-silver-star {
          margin-left: 5px;
          color: silver;
        }
        .champion-stats {
          display: flex;
          flex-wrap: wrap;
          font-size: 0.85rem;
          color: #ffffff; /* Texte plus clair pour les statistiques */
        }
        .champion-stat {
          margin-right: 10px;
        }
      `;
      document.head.appendChild(style);
    }
    
    champContainer.innerHTML = ''; // Vider le conteneur
    
    // Ajouter le titre général
    const title = document.createElement('h3');
    title.textContent = 'Champions';
    title.style.marginBottom = '0.5rem';
    champContainer.appendChild(title);
    
    // Ajouter le champion de tous les temps
    if (allTimeBestOrganism) {
      const champCard = document.createElement('div');
      champCard.className = 'champion-card';
      
      // Titre avec couleur
      const champTitle = document.createElement('div');
      champTitle.className = 'champion-title';
      
      // Cercle coloré représentant la couleur du champion
      const colorSpan = document.createElement('span');
      colorSpan.className = 'champion-color';
      colorSpan.style.backgroundColor = `rgb(${allTimeBestOrganism.genome.color[0]}, ${allTimeBestOrganism.genome.color[1]}, ${allTimeBestOrganism.genome.color[2]})`;
      champTitle.appendChild(colorSpan);
      
      // Texte du titre
      const titleText = document.createElement('span');
      titleText.textContent = 'Champion historique';
      champTitle.appendChild(titleText);
      
      // Étoile dorée
      const star = document.createElement('span');
      star.className = 'champion-star';
      star.textContent = '★'; // Étoile pleine
      champTitle.appendChild(star);
      
      champCard.appendChild(champTitle);
      
      // Statistiques du champion
      const statsDiv = document.createElement('div');
      statsDiv.className = 'champion-stats';
      
      // Génération
      const genStat = document.createElement('div');
      genStat.className = 'champion-stat';
      genStat.textContent = `Gén: ${allTimeBestOrganism.generation || 'N/A'}`;
      statsDiv.appendChild(genStat);
      
      // Fitness
      const fitnessStat = document.createElement('div');
      fitnessStat.className = 'champion-stat';
      fitnessStat.textContent = `Fitness: ${Math.round(allTimeBestOrganism.fitness)}`;
      statsDiv.appendChild(fitnessStat);
      
      // Taille
      const sizeStat = document.createElement('div');
      sizeStat.className = 'champion-stat';
      sizeStat.textContent = `Taille: ${allTimeBestOrganism.genome.size.toFixed(1)}`;
      statsDiv.appendChild(sizeStat);
      
      // Vitesse
      const speedStat = document.createElement('div');
      speedStat.className = 'champion-stat';
      speedStat.textContent = `Vitesse: ${allTimeBestOrganism.genome.speed.toFixed(1)}`;
      statsDiv.appendChild(speedStat);
      
      champCard.appendChild(statsDiv);
      
      // Conteneur pour les détails du génome (toujours visible)
      const genomeDetails = document.createElement('div');
      genomeDetails.className = 'genome-details';
      genomeDetails.style.marginTop = '8px';
      genomeDetails.style.padding = '8px';
      genomeDetails.style.backgroundColor = '#1a2634';
      genomeDetails.style.borderRadius = '4px';
      genomeDetails.style.fontSize = '0.8rem';
      genomeDetails.style.color = '#ffffff'; // Texte blanc pour meilleure lisibilité
      
      // Titre pour la section
      const genomeTitle = document.createElement('div');
      genomeTitle.textContent = 'Génome complet';
      genomeTitle.style.fontWeight = 'bold';
      genomeTitle.style.marginBottom = '5px';
      genomeDetails.appendChild(genomeTitle);
      
      // Ajouter chaque propriété du génome
      const genome = allTimeBestOrganism.genome;
      const genomeProps = [
        { name: 'Vitesse', value: genome.speed.toFixed(2) },
        { name: 'Portée de détection', value: genome.sensorRange.toFixed(1) },
        { name: 'Taille', value: genome.size.toFixed(2) },
        { name: 'Métabolisme', value: genome.metabolism.toFixed(3) },
        { name: 'Couleur', value: `RGB(${genome.color.join(', ')})` },
        { name: 'Seuil de reproduction', value: genome.reproductionThreshold.toFixed(1) },
        { name: 'Agressivité', value: genome.aggressiveness.toFixed(2) }
      ];
      
      // Créer une table pour afficher le génome
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      
      // Ajouter chaque propriété en ligne
      genomeProps.forEach(prop => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = prop.name;
        nameCell.style.paddingRight = '10px';
        nameCell.style.fontWeight = 'bold';
        row.appendChild(nameCell);
        
        const valueCell = document.createElement('td');
        valueCell.textContent = prop.value;
        row.appendChild(valueCell);
        
        table.appendChild(row);
      });
      
      genomeDetails.appendChild(table);
      champCard.appendChild(genomeDetails);
      
      champContainer.appendChild(champCard);
    }
    
    // Ajouter le champion actuel si différent du champion historique
    if (currentBestOrganism && (!allTimeBestOrganism || currentBestOrganism.id !== allTimeBestOrganism.id)) {
      const champCard = document.createElement('div');
      champCard.className = 'champion-card';
      
      // Titre avec couleur
      const champTitle = document.createElement('div');
      champTitle.className = 'champion-title';
      
      // Cercle coloré représentant la couleur du champion
      const colorSpan = document.createElement('span');
      colorSpan.className = 'champion-color';
      colorSpan.style.backgroundColor = `rgb(${currentBestOrganism.genome.color[0]}, ${currentBestOrganism.genome.color[1]}, ${currentBestOrganism.genome.color[2]})`;
      champTitle.appendChild(colorSpan);
      
      // Texte du titre
      const titleText = document.createElement('span');
      titleText.textContent = 'Champion actuel';
      champTitle.appendChild(titleText);
      
      // Étoile argentée
      const star = document.createElement('span');
      star.className = 'champion-silver-star';
      star.textContent = '☆'; // Étoile vide
      champTitle.appendChild(star);
      
      champCard.appendChild(champTitle);
      
      // Statistiques du champion
      const statsDiv = document.createElement('div');
      statsDiv.className = 'champion-stats';
      
      // Fitness
      const fitnessStat = document.createElement('div');
      fitnessStat.className = 'champion-stat';
      fitnessStat.textContent = `Fitness: ${Math.round(currentBestOrganism.fitness)}`;
      statsDiv.appendChild(fitnessStat);
      
      // Taille
      const sizeStat = document.createElement('div');
      sizeStat.className = 'champion-stat';
      sizeStat.textContent = `Taille: ${currentBestOrganism.genome.size.toFixed(1)}`;
      statsDiv.appendChild(sizeStat);
      
      // Vitesse
      const speedStat = document.createElement('div');
      speedStat.className = 'champion-stat';
      speedStat.textContent = `Vitesse: ${currentBestOrganism.genome.speed.toFixed(1)}`;
      statsDiv.appendChild(speedStat);
      
      champCard.appendChild(statsDiv);
      champContainer.appendChild(champCard);
    }
  }
  
  // Fonctionalités de chargement et sauvegarde de simulation supprimées
}
