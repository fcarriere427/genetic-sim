/**
 * Classe responsable du rendu graphique de la simulation
 */
class SimulationRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    this.simulationState = null; // État de la simulation
    
    // Redimensionnement du canvas lors du redimensionnement de la fenêtre
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  /**
   * Ajuste la taille du canvas à son conteneur parent
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }
  
  /**
   * Efface le canvas
   */
  clear() {
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Dessine l'état actuel de la simulation
   * @param {Object} simulationState - État actuel de la simulation
   */
  render(simulationState) {
    if (!simulationState) return;
    
    // Stocker l'état de la simulation
    this.simulationState = simulationState;
    
    this.clear();
    
    // Dimensionner l'environnement au canvas
    const scaleX = this.canvas.width / simulationState.environment.width;
    const scaleY = this.canvas.height / simulationState.environment.height;
    
    // Dessiner les obstacles
    this.renderObstacles(simulationState.environment.obstacles, scaleX, scaleY);
    
    // Dessiner la nourriture
    this.renderFood(simulationState.environment.foodSources, scaleX, scaleY);
    
    // Dessiner les organismes
    this.renderOrganisms(simulationState.population, scaleX, scaleY);
    
    // Afficher la génération actuelle
    this.renderGenerationInfo(simulationState.generation);
    
    // Afficher les informations des champions
    this.renderChampionInfo();
  }
  
  /**
   * Dessine les obstacles dans l'environnement
   */
  renderObstacles(obstacles, scaleX, scaleY) {
    this.ctx.fillStyle = '#555';
    
    obstacles.forEach(obstacle => {
      this.ctx.fillRect(
        obstacle.x * scaleX,
        obstacle.y * scaleY,
        obstacle.width * scaleX,
        obstacle.height * scaleY
      );
    });
  }
  
  /**
   * Dessine les sources de nourriture
   */
  renderFood(foodSources, scaleX, scaleY) {
    foodSources.forEach(food => {
      if (!food.isConsumed) {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(
          food.x * scaleX,
          food.y * scaleY,
          5,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      }
    });
  }
  
  /**
   * Dessine les organismes
   */
  renderOrganisms(organisms, scaleX, scaleY) {
    // D'abord, dessiner tous les organismes normaux
    organisms.forEach(organism => {
      if (organism.isDead) return;
      
      // Vérifier si l'organisme est un champion
      const isCurrentBest = organism.id === this.simulationState?.currentBestOrganism?.id;
      const isAllTimeBest = organism.id === this.simulationState?.allTimeBestOrganism?.id;
      
      // Si c'est un champion, on le dessinera dans une itération séparée
      if (isCurrentBest || isAllTimeBest) return;

      // Couleur basée sur le génome
      let color;
      
      // Si l'organisme vient de se reproduire, le colorer en rouge
      if (organism.justReproduced > 0) {
        // Interpoler entre rouge (#ff0000) et la couleur d'origine en fonction du temps restant
        const ratio = organism.justReproduced / 50; // 50 étant la durée totale du marqueur
        const r = Math.min(255, Math.round(255 * ratio + organism.genome.color[0] * (1 - ratio)));
        const g = Math.round(organism.genome.color[1] * (1 - ratio));
        const b = Math.round(organism.genome.color[2] * (1 - ratio));
        color = `rgb(${r}, ${g}, ${b})`;
        
        // Ajouter un message visuel pour la reproduction
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px Arial';
        this.ctx.fillText('❤', // Symbole coeur
          organism.x * scaleX,
          (organism.y - organism.genome.size - 10) * scaleY
        );
      } else {
        color = `rgb(${organism.genome.color[0]}, ${organism.genome.color[1]}, ${organism.genome.color[2]})`;
      }
      
      // Corps
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(
        organism.x * scaleX,
        organism.y * scaleY,
        organism.genome.size * scaleX,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      // Direction (nez)
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(
        organism.x * scaleX,
        organism.y * scaleY
      );
      this.ctx.lineTo(
        (organism.x + Math.cos(organism.direction) * organism.genome.size) * scaleX,
        (organism.y + Math.sin(organism.direction) * organism.genome.size) * scaleY
      );
      this.ctx.stroke();
      
      // Optionnel : Dessiner le niveau d'énergie
      const energyPercentage = organism.energy / (organism.genome.reproductionThreshold * 1.2);
      const energyBarWidth = organism.genome.size * 2 * scaleX;
      const energyBarHeight = 3;
      
      this.ctx.fillStyle = '#ddd';
      this.ctx.fillRect(
        (organism.x - organism.genome.size) * scaleX,
        (organism.y - organism.genome.size - 5) * scaleY,
        energyBarWidth,
        energyBarHeight
      );
      
      this.ctx.fillStyle = energyPercentage > 0.5 ? '#2ecc71' : '#f39c12';
      this.ctx.fillRect(
        (organism.x - organism.genome.size) * scaleX,
        (organism.y - organism.genome.size - 5) * scaleY,
        energyBarWidth * Math.min(1, energyPercentage),
        energyBarHeight
      );
    });
    
    // Maintenant, dessiner les champions par-dessus
    organisms.forEach(organism => {
      if (organism.isDead) return;
      
      // Vérifier si l'organisme est un champion
      const isCurrentBest = organism.id === this.simulationState?.currentBestOrganism?.id;
      const isAllTimeBest = organism.id === this.simulationState?.allTimeBestOrganism?.id;
      
      // Ne dessiner que les champions dans cette itération
      if (!isCurrentBest && !isAllTimeBest) return;

      // Dessiner une aura autour des champions
      if (isAllTimeBest) {
        // Aura dorée pour le meilleur de tous les temps
        this.ctx.shadowColor = 'gold';
        this.ctx.shadowBlur = 20;
        this.ctx.strokeStyle = 'gold';
        this.ctx.lineWidth = 3;
      } else if (isCurrentBest) {
        // Aura argentée pour le meilleur actuel
        this.ctx.shadowColor = 'silver';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = 'silver';
        this.ctx.lineWidth = 2;
      }
      
      // Dessiner l'aura
      this.ctx.beginPath();
      this.ctx.arc(
        organism.x * scaleX,
        organism.y * scaleY,
        (organism.genome.size + 5) * scaleX,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
      
      // Réinitialiser les effets d'ombre
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      
      // Couleur de base de l'organisme
      let color = `rgb(${organism.genome.color[0]}, ${organism.genome.color[1]}, ${organism.genome.color[2]})`;
      
      // Corps
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(
        organism.x * scaleX,
        organism.y * scaleY,
        organism.genome.size * scaleX,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      // Direction (nez)
      this.ctx.strokeStyle = isAllTimeBest ? 'gold' : 'white';
      this.ctx.lineWidth = isAllTimeBest ? 3 : 2;
      this.ctx.beginPath();
      this.ctx.moveTo(
        organism.x * scaleX,
        organism.y * scaleY
      );
      this.ctx.lineTo(
        (organism.x + Math.cos(organism.direction) * organism.genome.size) * scaleX,
        (organism.y + Math.sin(organism.direction) * organism.genome.size) * scaleY
      );
      this.ctx.stroke();
      
      // Ajouter une couronne ou un indicateur
      this.ctx.fillStyle = isAllTimeBest ? 'gold' : 'silver';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(
        isAllTimeBest ? '★' : '☆', // Étoile pleine ou vide
        organism.x * scaleX,
        (organism.y - organism.genome.size - 10) * scaleY
      );
      
      // Barre d'énergie
      const energyPercentage = organism.energy / (organism.genome.reproductionThreshold * 1.2);
      const energyBarWidth = organism.genome.size * 2 * scaleX;
      const energyBarHeight = 4; // Légèrement plus grande pour les champions
      
      this.ctx.fillStyle = '#ddd';
      this.ctx.fillRect(
        (organism.x - organism.genome.size) * scaleX,
        (organism.y - organism.genome.size - 5) * scaleY,
        energyBarWidth,
        energyBarHeight
      );
      
      this.ctx.fillStyle = isAllTimeBest ? 'gold' : '#2ecc71';
      this.ctx.fillRect(
        (organism.x - organism.genome.size) * scaleX,
        (organism.y - organism.genome.size - 5) * scaleY,
        energyBarWidth * Math.min(1, energyPercentage),
        energyBarHeight
      );
    });
  }
  
  /**
   * Affiche des informations sur la génération actuelle
   */
  renderGenerationInfo(generation) {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Génération: ${generation}`, 10, 20);
  }
  
  /**
   * Affiche les informations des champions
   */
  renderChampionInfo() {
    if (!this.simulationState) return;
    
    const { allTimeBestOrganism, currentBestOrganism } = this.simulationState;
    if (!allTimeBestOrganism && !currentBestOrganism) return;
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    
    let y = 40; // Position verticale
    
    // Afficher le champion de tous les temps
    if (allTimeBestOrganism) {
      this.ctx.fillText('Champion historique:', 10, y);
      y += 20;
      
      // Dessiner un petit cercle de la couleur du champion
      const color = `rgb(${allTimeBestOrganism.genome.color[0]}, ${allTimeBestOrganism.genome.color[1]}, ${allTimeBestOrganism.genome.color[2]})`;
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(15, y - 5, 5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Dessiner une étoile dorée à côté
      this.ctx.fillStyle = 'gold';
      this.ctx.font = '12px Arial';
      this.ctx.fillText('★', 25, y); // Étoile dorée
      
      // Informations sur le champion
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(`Fitness: ${Math.round(allTimeBestOrganism.fitness)}`, 40, y);
      y += 15;
      this.ctx.fillText(`Gén: ${allTimeBestOrganism.generation || 'N/A'}`, 40, y);
      y += 15;
      this.ctx.fillText(`Taille: ${allTimeBestOrganism.genome.size.toFixed(1)}`, 40, y);
      y += 15;
      this.ctx.fillText(`Vitesse: ${allTimeBestOrganism.genome.speed.toFixed(1)}`, 40, y);
      y += 25;
    }
    
    // Afficher le champion actuel
    if (currentBestOrganism && (!allTimeBestOrganism || currentBestOrganism.id !== allTimeBestOrganism.id)) {
      this.ctx.fillText('Champion actuel:', 10, y);
      y += 20;
      
      // Dessiner un petit cercle de la couleur du champion
      const color = `rgb(${currentBestOrganism.genome.color[0]}, ${currentBestOrganism.genome.color[1]}, ${currentBestOrganism.genome.color[2]})`;
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(15, y - 5, 5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Dessiner une étoile argentée à côté
      this.ctx.fillStyle = 'silver';
      this.ctx.fillText('☆', 25, y); // Étoile vide argentée
      
      // Informations sur le champion
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(`Fitness: ${Math.round(currentBestOrganism.fitness)}`, 40, y);
      y += 15;
      this.ctx.fillText(`Taille: ${currentBestOrganism.genome.size.toFixed(1)}`, 40, y);
      y += 15;
      this.ctx.fillText(`Vitesse: ${currentBestOrganism.genome.speed.toFixed(1)}`, 40, y);
    }
  }
}
