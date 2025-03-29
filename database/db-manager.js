const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin de la base de données
const dbPath = path.join(__dirname, 'genetic-sim.db');

// Connection à la base de données
let db;

/**
 * Initialise la base de données SQLite
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erreur de connexion à la base de données:', err.message);
        reject(err);
        return;
      }
      
      console.log('Connecté à la base de données SQLite');
      
      // Créer les tables si elles n'existent pas
      db.run(`
        CREATE TABLE IF NOT EXISTS simulations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
          config TEXT NOT NULL
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS generations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          simulation_id INTEGER,
          generation_num INTEGER,
          best_fitness REAL,
          avg_fitness REAL,
          population_size INTEGER,
          date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (simulation_id) REFERENCES simulations (id)
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS organisms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          simulation_id INTEGER,
          generation_id INTEGER,
          genome TEXT,
          fitness REAL,
          FOREIGN KEY (simulation_id) REFERENCES simulations (id),
          FOREIGN KEY (generation_id) REFERENCES generations (id)
        )
      `);
      
      resolve();
    });
  });
}

/**
 * Sauvegarde une nouvelle simulation
 * @param {string} name - Nom de la simulation
 * @param {Object} config - Configuration de la simulation
 * @returns {Promise<number>} - ID de la simulation
 */
function saveSimulation(name, config) {
  return new Promise((resolve, reject) => {
    const configStr = JSON.stringify(config);
    
    db.run(
      'INSERT INTO simulations (name, config) VALUES (?, ?)',
      [name, configStr],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(this.lastID);
      }
    );
  });
}

/**
 * Sauvegarde les données d'une génération
 * @param {number} simulationId - ID de la simulation
 * @param {Object} generationData - Données de la génération
 * @returns {Promise<number>} - ID de la génération
 */
function saveGeneration(simulationId, generationData) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO generations 
       (simulation_id, generation_num, best_fitness, avg_fitness, population_size) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        simulationId,
        generationData.generation,
        generationData.bestFitness,
        generationData.averageFitness,
        generationData.populationSize
      ],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(this.lastID);
      }
    );
  });
}

/**
 * Sauvegarde un organisme remarquable
 * @param {number} simulationId - ID de la simulation
 * @param {number} generationId - ID de la génération
 * @param {Object} organism - Données de l'organisme
 */
function saveOrganism(simulationId, generationId, organism) {
  return new Promise((resolve, reject) => {
    const genomeStr = JSON.stringify(organism.genome);
    
    db.run(
      'INSERT INTO organisms (simulation_id, generation_id, genome, fitness) VALUES (?, ?, ?, ?)',
      [simulationId, generationId, genomeStr, organism.fitness],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(this.lastID);
      }
    );
  });
}

/**
 * Récupère la liste des simulations
 * @returns {Promise<Array>} - Liste des simulations
 */
function getSimulations() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM simulations ORDER BY date_created DESC', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(rows);
    });
  });
}

/**
 * Récupère les détails d'une simulation
 * @param {number} id - ID de la simulation
 * @returns {Promise<Object>} - Détails de la simulation
 */
function getSimulationDetails(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM simulations WHERE id = ?', [id], (err, simulation) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!simulation) {
        reject(new Error('Simulation non trouvée'));
        return;
      }
      
      // Parse configuration
      simulation.config = JSON.parse(simulation.config);
      
      // Get generations
      db.all(
        'SELECT * FROM generations WHERE simulation_id = ? ORDER BY generation_num',
        [id],
        (err, generations) => {
          if (err) {
            reject(err);
            return;
          }
          
          simulation.generations = generations;
          resolve(simulation);
        }
      );
    });
  });
}

/**
 * Récupère les meilleurs organismes d'une génération
 * @param {number} generationId - ID de la génération
 * @param {number} limit - Nombre d'organismes à récupérer
 * @returns {Promise<Array>} - Liste des organismes
 */
function getBestOrganisms(generationId, limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM organisms WHERE generation_id = ? ORDER BY fitness DESC LIMIT ?',
      [generationId, limit],
      (err, organisms) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Parse les génomes
        organisms.forEach(org => {
          org.genome = JSON.parse(org.genome);
        });
        
        resolve(organisms);
      }
    );
  });
}

/**
 * Ferme la connexion à la base de données
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initDatabase,
  saveSimulation,
  saveGeneration,
  saveOrganism,
  getSimulations,
  getSimulationDetails,
  getBestOrganisms,
  closeDatabase
};
