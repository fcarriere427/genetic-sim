/**
 * Moteur de simulation pour les algorithmes génétiques
 * Gère la logique de la simulation sans dépendre de l'interface utilisateur
 */

// Configuration par défaut de la simulation
const DEFAULT_CONFIG = {
  populationSize: 20,
  mutationRate: 0.05,
  crossoverRate: 0.7,
  generationLimit: 100,
  environmentWidth: 800,
  environmentHeight: 600,
  foodAmount: 30,
  obstacleAmount: 5
};

// État global de la simulation
let isPaused = false;
let simulationSpeed = 1;

/**
 * Crée un nouvel environnement de simulation
 * @param {Object} config - Configuration de la simulation
 * @returns {Object} - Objet simulation initialisé
 */
function createSimulation(config = {}) {
  // Fusionner avec la configuration par défaut
  const simulationConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Créer l'environnement
  const environment = createEnvironment(
    simulationConfig.environmentWidth,
    simulationConfig.environmentHeight,
    simulationConfig.foodAmount,
    simulationConfig.obstacleAmount
  );
  
  // Créer la population initiale
  const population = createInitialPopulation(
    simulationConfig.populationSize,
    environment
  );
  
  return {
    config: simulationConfig,
    environment,
    population,
    generation: 0,
    generationAge: 0,  // Suivre l'âge d'une génération
    generationMaxAge: 1000, // Durée de vie maximale d'une génération
    statistics: {
      bestFitness: 0,
      averageFitness: 0,
      worstFitness: 0
    },
    isFinished: false
  };
}

/**
 * Crée l'environnement de simulation
 */
function createEnvironment(width, height, foodAmount, obstacleAmount) {
  // Créer les sources de nourriture
  const foodSources = [];
  for (let i = 0; i < foodAmount; i++) {
    foodSources.push({
      id: `food-${i}`,
      x: Math.random() * width,
      y: Math.random() * height,
      energy: 50,
      isConsumed: false
    });
  }
  
  // Créer les obstacles
  const obstacles = [];
  for (let i = 0; i < obstacleAmount; i++) {
    obstacles.push({
      id: `obstacle-${i}`,
      x: Math.random() * width,
      y: Math.random() * height,
      width: 20 + Math.random() * 60,
      height: 20 + Math.random() * 60
    });
  }
  
  return {
    width,
    height,
    foodSources,
    obstacles
  };
}

/**
 * Crée la population initiale d'organismes
 */
function createInitialPopulation(size, environment) {
  const organisms = [];
  
  for (let i = 0; i < size; i++) {
    organisms.push(createOrganism(environment, i));
  }
  
  return organisms;
}

/**
 * Crée un organisme individuel avec un génome aléatoire
 */
function createOrganism(environment, id) {
  // Génome aléatoire pour commencer
  const genome = {
    speed: 0.5 + Math.random() * 2,           // Vitesse de déplacement
    sensorRange: 50 + Math.random() * 100,    // Distance de détection
    size: 5 + Math.random() * 10,             // Taille physique 
    metabolism: 0.2 + Math.random() * 0.6,    // Consommation d'énergie
    color: [                                  // Couleur RGB
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255)
    ],
    reproductionThreshold: 100 + Math.random() * 100,  // Énergie nécessaire pour se reproduire
    aggressiveness: Math.random()             // Tendance à attaquer d'autres organismes
  };
  
  return {
    id: `organism-${id}`,
    genome,
    x: Math.random() * environment.width,
    y: Math.random() * environment.height,
    direction: Math.random() * Math.PI * 2,   // Direction en radians
    energy: 100,
    age: 0,
    foodEaten: 0,
    children: 0,
    isDead: false,
    fitness: 0
  };
}

/**
 * Met à jour l'état de la simulation
 * @param {Object} simulation - État actuel de la simulation
 * @returns {Object} - Nouvel état de la simulation
 */
function updateSimulation(simulation) {
  // Si en pause, ne rien faire
  if (isPaused) {
    return simulation;
  }
  
  // Incrémenter l'âge de la génération
  simulation.generationAge += simulationSpeed;
  
  // Mettre à jour chaque organisme
  simulation.population.forEach(organism => {
    if (organism.isDead) return;
    
    // Appliquer le métabolisme (consommation d'énergie au repos)
    organism.energy -= organism.genome.metabolism * simulationSpeed;
    organism.age += 0.1 * simulationSpeed;
    
    // Vérifier si l'organisme meurt de faim
    if (organism.energy <= 0) {
      organism.isDead = true;
      return;
    }
    
    // Trouver la nourriture la plus proche
    const closestFood = findClosestFood(organism, simulation.environment.foodSources);
    
    // Si de la nourriture est trouvée, se diriger vers elle
    if (closestFood) {
      // Calculer la direction vers la nourriture
      const dx = closestFood.x - organism.x;
      const dy = closestFood.y - organism.y;
      organism.direction = Math.atan2(dy, dx);
      
      // Déplacer l'organisme vers la nourriture
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < organism.genome.size + 5) {
        // Manger la nourriture
        consumeFood(organism, closestFood);
      } else {
        // Se déplacer vers la nourriture
        moveOrganism(organism, simulation.environment);
      }
    } else {
      // Mouvement aléatoire si pas de nourriture visible
      if (Math.random() < 0.05) {
        organism.direction += (Math.random() - 0.5) * Math.PI / 2;
      }
      moveOrganism(organism, simulation.environment);
    }
    
    // Vérifier la reproduction
    if (organism.energy > organism.genome.reproductionThreshold) {
      reproduceOrganism(organism, simulation);
    }
    
    // Calculer le fitness
    organism.fitness = calculateFitness(organism);
  });
  
  // Régénérer la nourriture consommée occasionnellement
  regenerateFood(simulation.environment);
  
  // Nettoyer les organismes morts
  simulation.population = simulation.population.filter(org => !org.isDead);
  
  // Créer une nouvelle génération si:
  // 1. Tous les organismes sont morts
  // 2. La génération a atteint son âge maximal
  // 3. La nourriture est presque épuisée
  const foodConsumedRatio = simulation.environment.foodSources.filter(f => f.isConsumed).length / 
                           simulation.environment.foodSources.length;

  if (simulation.population.length === 0 ||
      simulation.generationAge >= simulation.generationMaxAge ||
      foodConsumedRatio > 0.9) {
    createNewGeneration(simulation);
    // Réinitialiser l'âge de la génération
    simulation.generationAge = 0;
  }
  
  // Mettre à jour les statistiques
  updateStatistics(simulation);
  
  // Vérifier si la simulation est terminée
  if (simulation.generation >= simulation.config.generationLimit) {
    simulation.isFinished = true;
  }
  
  return simulation;
}

/**
 * Déplace un organisme dans l'environnement
 */
function moveOrganism(organism, environment) {
  // Calculer le nouveau déplacement
  const speed = organism.genome.speed * simulationSpeed;
  const dx = Math.cos(organism.direction) * speed;
  const dy = Math.sin(organism.direction) * speed;
  
  // Appliquer le déplacement
  organism.x += dx;
  organism.y += dy;
  
  // Consommer de l'énergie pour le mouvement
  organism.energy -= 0.1 * speed;
  
  // Limites de l'environnement (rebondissement)
  if (organism.x < 0) {
    organism.x = 0;
    organism.direction = Math.PI - organism.direction;
  }
  if (organism.x > environment.width) {
    organism.x = environment.width;
    organism.direction = Math.PI - organism.direction;
  }
  if (organism.y < 0) {
    organism.y = 0;
    organism.direction = -organism.direction;
  }
  if (organism.y > environment.height) {
    organism.y = environment.height;
    organism.direction = -organism.direction;
  }
  
  // Détection de collision avec les obstacles
  environment.obstacles.forEach(obstacle => {
    if (
      organism.x > obstacle.x - organism.genome.size &&
      organism.x < obstacle.x + obstacle.width + organism.genome.size &&
      organism.y > obstacle.y - organism.genome.size &&
      organism.y < obstacle.y + obstacle.height + organism.genome.size
    ) {
      // Rebondir dans la direction opposée
      organism.direction += Math.PI;
      organism.x += Math.cos(organism.direction) * speed * 2;
      organism.y += Math.sin(organism.direction) * speed * 2;
    }
  });
}

/**
 * Trouve la source de nourriture la plus proche
 */
function findClosestFood(organism, foodSources) {
  let closest = null;
  let closestDistance = organism.genome.sensorRange;
  
  foodSources.forEach(food => {
    if (!food.isConsumed) {
      const dx = food.x - organism.x;
      const dy = food.y - organism.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < closestDistance) {
        closest = food;
        closestDistance = distance;
      }
    }
  });
  
  return closest;
}

/**
 * Consomme une source de nourriture
 */
function consumeFood(organism, food) {
  if (!food.isConsumed) {
    organism.energy += food.energy;
    organism.foodEaten++;
    food.isConsumed = true;
  }
}

/**
 * Régénère les sources de nourriture consommées
 */
function regenerateFood(environment) {
  if (Math.random() < 0.01 * simulationSpeed) {
    environment.foodSources.forEach(food => {
      if (food.isConsumed && Math.random() < 0.1) {
        food.isConsumed = false;
        food.x = Math.random() * environment.width;
        food.y = Math.random() * environment.height;
      }
    });
  }
}

/**
 * Reproduction d'un organisme
 */
function reproduceOrganism(parent, simulation) {
  // Créer un nouvel organisme avec un génome muté
  const childGenome = mutateGenome(parent.genome, simulation.config.mutationRate);
  
  const child = {
    id: `organism-${simulation.population.length}`,
    genome: childGenome,
    x: parent.x + (Math.random() - 0.5) * 20,
    y: parent.y + (Math.random() - 0.5) * 20,
    direction: Math.random() * Math.PI * 2,
    energy: parent.energy * 0.3, // Transfert d'énergie au descendant
    age: 0,
    foodEaten: 0,
    children: 0,
    isDead: false,
    fitness: 0
  };
  
  // Réduire l'énergie du parent
  parent.energy *= 0.7;
  parent.children++;
  
  // Ajouter l'enfant à la population
  simulation.population.push(child);
}

/**
 * Mutation du génome
 */
function mutateGenome(genome, mutationRate) {
  // Copier le génome parent
  const newGenome = { ...genome };
  
  // Muter chaque caractéristique avec une certaine probabilité
  if (Math.random() < mutationRate) {
    newGenome.speed *= 0.8 + Math.random() * 0.4; // ±20%
  }
  
  if (Math.random() < mutationRate) {
    newGenome.sensorRange *= 0.8 + Math.random() * 0.4;
  }
  
  if (Math.random() < mutationRate) {
    newGenome.size *= 0.8 + Math.random() * 0.4;
  }
  
  if (Math.random() < mutationRate) {
    newGenome.metabolism *= 0.8 + Math.random() * 0.4;
  }
  
  if (Math.random() < mutationRate) {
    newGenome.reproductionThreshold *= 0.8 + Math.random() * 0.4;
  }
  
  if (Math.random() < mutationRate) {
    newGenome.aggressiveness = Math.max(0, Math.min(1, 
      newGenome.aggressiveness + (Math.random() - 0.5) * 0.2
    ));
  }
  
  // Mutation de la couleur
  if (Math.random() < mutationRate) {
    newGenome.color = newGenome.color.map(channel => {
      const newValue = channel + Math.floor((Math.random() - 0.5) * 50);
      return Math.max(0, Math.min(255, newValue));
    });
  }
  
  return newGenome;
}

/**
 * Calcule le fitness d'un organisme
 */
function calculateFitness(organism) {
  // Formule de fitness plus robuste avec plus de poids sur la nourriture et les descendants
  return Math.max(0, // Toujours positif
         organism.age + 
         organism.energy * 0.5 + 
         organism.foodEaten * 20 +  // Doubler la valeur de la nourriture mangée
         organism.children * 30);   // Doubler la valeur des descendants
}

/**
 * Crée une nouvelle génération à partir de la précédente
 */
function createNewGeneration(simulation) {
  // Sauvegarder les statistiques de la génération précédente
  const previousGen = {
    generation: simulation.generation,
    bestFitness: simulation.statistics.bestFitness,
    averageFitness: simulation.statistics.averageFitness,
    populationSize: simulation.population.length
  };
  
  // Augmenter le compteur de génération
  simulation.generation++;
  
  // Conserver les meilleures statistiques pour l'historique du graphique
  const prevStats = { ...simulation.statistics };
  
  // Si la population est vide, créer une nouvelle population initiale
  if (simulation.population.length === 0) {
    simulation.population = createInitialPopulation(
      simulation.config.populationSize,
      simulation.environment
    );
    console.log(`Nouvelle génération ${simulation.generation} créée avec une population initiale`);
    return previousGen;
  }
  
  // Régénérer la nourriture pour la nouvelle génération
  simulation.environment.foodSources.forEach(food => {
    food.isConsumed = false;
    food.x = Math.random() * simulation.environment.width;
    food.y = Math.random() * simulation.environment.height;
  });

  console.log(`Génération ${simulation.generation} créée avec évolution de la population`);
  return previousGen;
}

/**
 * Met à jour les statistiques de la simulation
 */
function updateStatistics(simulation) {
  // Conserver les valeurs précédentes si la population est vide
  if (simulation.population.length === 0) {
    // Ne pas réinitialiser à zéro, conserver les statistiques précédentes
    return;
  }
  
  // Calculer la fitness pour tous les organismes
  const fitnesses = simulation.population.map(org => org.fitness);
  
  simulation.statistics = {
    bestFitness: Math.max(...fitnesses),
    averageFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
    worstFitness: Math.min(...fitnesses)
  };
}

/**
 * Mettre en pause ou reprendre la simulation
 */
function togglePause(status) {
  isPaused = status;
}

/**
 * Définir la vitesse de la simulation
 */
function setSimulationSpeed(speed) {
  simulationSpeed = speed;
}

module.exports = {
  createSimulation,
  updateSimulation,
  togglePause,
  setSimulationSpeed
};
