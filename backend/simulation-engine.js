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
let simulationSpeed = 5; // Vitesse augmentée à 5 (au lieu de 1)

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
    fitnessHistory: [],  // Historique des fitness pour la génération actuelle
    allTimeBestOrganism: null, // Meilleur organisme de tous les temps
    currentBestOrganism: null, // Meilleur organisme vivant actuellement
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
    fitness: 0,
    justReproduced: 0  // Initialisation à 0 (pas de reproduction récente)
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
    
    // Décrémenter le marqueur de reproduction s'il existe
    if (organism.justReproduced > 0) {
      organism.justReproduced -= simulationSpeed;
      if (organism.justReproduced < 0) organism.justReproduced = 0;
    }
    
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
  
  // Gérer les collisions entre organismes
  handleOrganismCollisions(simulation.population, simulation.environment);
  
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
  
  // Nouvelle position potentielle
  const newX = organism.x + dx;
  const newY = organism.y + dy;
  
  // Consommer de l'énergie pour le mouvement
  organism.energy -= 0.1 * speed;
  
  // Gérer les collisions avec les limites de l'environnement
  let collision = false;
  
  // Collision avec les bords en tenant compte de la taille
  if (newX - organism.genome.size < 0) {
    organism.x = organism.genome.size; // Positionner à la marge de la taille
    organism.direction = Math.PI - organism.direction;
    collision = true;
  } else if (newX + organism.genome.size > environment.width) {
    organism.x = environment.width - organism.genome.size;
    organism.direction = Math.PI - organism.direction;
    collision = true;
  } else {
    organism.x = newX; // Déplacer si pas de collision
  }
  
  if (newY - organism.genome.size < 0) {
    organism.y = organism.genome.size;
    organism.direction = -organism.direction;
    collision = true;
  } else if (newY + organism.genome.size > environment.height) {
    organism.y = environment.height - organism.genome.size;
    organism.direction = -organism.direction;
    collision = true;
  } else {
    organism.y = newY; // Déplacer si pas de collision
  }
  
  // Détection de collision avec les obstacles
  environment.obstacles.forEach(obstacle => {
    // Vérifier les quatre côtés de l'obstacle
    const leftEdge = obstacle.x;
    const rightEdge = obstacle.x + obstacle.width;
    const topEdge = obstacle.y;
    const bottomEdge = obstacle.y + obstacle.height;
    
    // Distance minimale entre le centre de l'organisme et les bords de l'obstacle
    const distX = Math.max(leftEdge - organism.x, 0, organism.x - rightEdge);
    const distY = Math.max(topEdge - organism.y, 0, organism.y - bottomEdge);
    
    // Détection de collision
    if (Math.sqrt(distX * distX + distY * distY) < organism.genome.size ||
        (organism.x >= leftEdge - organism.genome.size && 
         organism.x <= rightEdge + organism.genome.size &&
         organism.y >= topEdge - organism.genome.size &&
         organism.y <= bottomEdge + organism.genome.size)) {
      
      // Déterminer dans quelle direction pousser l'organisme
      // Trouver la direction de la force de répulsion
      const centerX = obstacle.x + obstacle.width / 2;
      const centerY = obstacle.y + obstacle.height / 2;
      
      // Direction depuis le centre de l'obstacle vers l'organisme
      const repulsionAngle = Math.atan2(organism.y - centerY, organism.x - centerX);
      
      // Déplacer l'organisme en dehors de l'obstacle
      const pushDistance = organism.genome.size + 1; // Un peu plus que la taille
      organism.x = organism.x + Math.cos(repulsionAngle) * pushDistance;
      organism.y = organism.y + Math.sin(repulsionAngle) * pushDistance;
      
      // Rebondir dans une direction similaire à la force de répulsion
      organism.direction = repulsionAngle + (Math.random() - 0.5) * (Math.PI / 4);
      
      collision = true;
    }
  });
  
  return collision; // Retourne true si une collision a eu lieu
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
    fitness: 0,
    justReproduced: 50  // Marqueur visuel qui durera 50 cycles
  };
  
  // Marquer le parent comme venant de se reproduire
  parent.justReproduced = 50;  // Durera 50 cycles
  
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
  
  // Réinitialiser l'historique des fitness pour la nouvelle génération
  simulation.fitnessHistory = [];
  
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
  
  // Calculer la fitness pour tous les organismes vivants actuels
  const fitnesses = simulation.population.map(org => org.fitness);
  
  // Échantillonnage périodique - ajouter à l'historique toutes les 10 itérations
  // pour éviter que l'historique ne devienne trop volumineux
  if (simulation.generationAge % 10 === 0) {
    simulation.fitnessHistory = simulation.fitnessHistory.concat(fitnesses);
  }
  
  // Si l'historique devient trop volumineux (plus de 1000 entrées),
  // conserver seulement les 1000 entrées les plus récentes
  if (simulation.fitnessHistory.length > 1000) {
    simulation.fitnessHistory = simulation.fitnessHistory.slice(
      simulation.fitnessHistory.length - 1000
    );
  }
  
  // Trouver le meilleur fitness de tous les temps pour cette génération
  const bestFitness = Math.max(
    Math.max(...fitnesses), // Meilleur fitness actuel
    simulation.fitnessHistory.length > 0 
      ? Math.max(...simulation.fitnessHistory) 
      : 0 // Meilleur fitness dans l'historique
  );
  
  // Calculer la moyenne sur l'ensemble de l'historique de la génération
  // ainsi que sur les organismes vivants actuels
  const allFitnesses = simulation.fitnessHistory.concat(fitnesses);
  const averageFitness = allFitnesses.length > 0
    ? allFitnesses.reduce((a, b) => a + b, 0) / allFitnesses.length
    : 0;
  
  // Mettre à jour les statistiques
  simulation.statistics = {
    bestFitness,
    averageFitness,
    worstFitness: Math.min(...fitnesses) // Fitness le plus bas parmi les organismes actuels
  };
  
  // Mettre à jour le meilleur organisme actuel
  if (fitnesses.length > 0) {
    const bestIndex = fitnesses.indexOf(Math.max(...fitnesses));
    simulation.currentBestOrganism = { ...simulation.population[bestIndex] };
    simulation.currentBestOrganism.isCurrentBest = true;
    
    // Mettre à jour le meilleur organisme de tous les temps si nécessaire
    if (!simulation.allTimeBestOrganism || 
        simulation.currentBestOrganism.fitness > simulation.allTimeBestOrganism.fitness) {
      simulation.allTimeBestOrganism = { ...simulation.currentBestOrganism };
      simulation.allTimeBestOrganism.isAllTimeBest = true;
      simulation.allTimeBestOrganism.generation = simulation.generation;
    }
  }
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

/**
 * Vérifie et gère les collisions entre les organismes
 */
function handleOrganismCollisions(organisms, environment) {
  // Parcourir tous les organismes
  for (let i = 0; i < organisms.length; i++) {
    const org1 = organisms[i];
    if (org1.isDead) continue;
    
    // Comparer avec tous les autres organismes
    for (let j = i + 1; j < organisms.length; j++) {
      const org2 = organisms[j];
      if (org2.isDead) continue;
      
      // Calculer la distance entre les deux organismes
      const dx = org2.x - org1.x;
      const dy = org2.y - org1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Distance minimale pour éviter la collision (somme des rayons)
      const minDistance = org1.genome.size + org2.genome.size;
      
      // Si collision
      if (distance < minDistance) {
        // Déterminer la direction de la force de répulsion
        const angle = Math.atan2(dy, dx);
        
        // Force proportionnelle à la pénétration
        const overlap = minDistance - distance;
        
        // Déplacer les organismes
        const moveRatio1 = org2.genome.size / (org1.genome.size + org2.genome.size);
        const moveRatio2 = org1.genome.size / (org1.genome.size + org2.genome.size);
        
        // Déplacer org1 à l'opposé de org2
        org1.x -= Math.cos(angle) * overlap * moveRatio1;
        org1.y -= Math.sin(angle) * overlap * moveRatio1;
        
        // Déplacer org2 à l'opposé de org1
        org2.x += Math.cos(angle) * overlap * moveRatio2;
        org2.y += Math.sin(angle) * overlap * moveRatio2;
        
        // Ajustement des directions (rebond léger)
        org1.direction = Math.atan2(-Math.sin(angle), -Math.cos(angle));
        org2.direction = Math.atan2(Math.sin(angle), Math.cos(angle));
        
        // Vérifier que les organismes restent dans les limites après la répulsion
        constrainToEnvironment(org1, environment);
        constrainToEnvironment(org2, environment);
      }
    }
  }
}

/**
 * Maintient un organisme dans les limites de l'environnement
 */
function constrainToEnvironment(organism, environment) {
  // Limites gauche/droite
  if (organism.x - organism.genome.size < 0) {
    organism.x = organism.genome.size;
  } else if (organism.x + organism.genome.size > environment.width) {
    organism.x = environment.width - organism.genome.size;
  }
  
  // Limites haut/bas
  if (organism.y - organism.genome.size < 0) {
    organism.y = organism.genome.size;
  } else if (organism.y + organism.genome.size > environment.height) {
    organism.y = environment.height - organism.genome.size;
  }
}
