/**
 * Classe responsable du rendu graphique de la simulation
 */
class SimulationRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    
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
    organisms.forEach(organism => {
      if (organism.isDead) return;
      
      // Couleur basée sur le génome
      const color = `rgb(${organism.genome.color[0]}, ${organism.genome.color[1]}, ${organism.genome.color[2]})`;
      
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
  }
  
  /**
   * Affiche des informations sur la génération actuelle
   */
  renderGenerationInfo(generation) {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Génération: ${generation}`, 10, 20);
  }
}
