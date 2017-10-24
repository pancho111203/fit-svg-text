import _ from 'ramda';

import { getRandom, getRandomInt, workerLog, clone } from './helpers';
import BestLineSplit from './BestLineSplit';
import { MIN_MAX_CONFIGS, DEFAULT_CONFIG } from './config';

class GeneticAlg {
  constructor(problemData) {
    this.bestSonCallbacks = [];
    this.genetic = null;
    this.shouldEnd = false;
    this.problemData = problemData;

    this.configuration = {
      size: 10,
      steps: 10,
      keepBest: true
    }

    this.bestLineSplit = new BestLineSplit(this.problemData.width, this.problemData.height, this.problemData.textLineHeight, this.problemData.wordLengths, this.problemData.spaceLength);
  }

  evolve = () => {
    if (this.configuration.steps === 0) {
      const computed = this.compute(DEFAULT_CONFIG);
      const ind = {
        config: DEFAULT_CONFIG,
        computed,
        fitness: this.fitness(DEFAULT_CONFIG, computed)
      }
      this.generationResult([ind], this.calculateStats([ind]));
      return;
    }

    let gen = [];
    for (let i = 0; i < this.configuration.size; ++i) {
      gen.push({
        config: this.seed(),
      });
    }

    for (let i = 0; i < this.configuration.steps && !this.shouldEnd; i++) {
      gen = gen.map((individual) => {
        const config = individual.config;
        const computedConfig = this.compute(config);
        const fitness = this.fitness(config, computedConfig);
        return {
          config,
          computed: computedConfig,
          fitness
        }
      })

      gen.sort((a, b) => {
        return this.optimizeFitness(a.fitness, b.fitness) ? -1 : 1;
      });

      gen = this.replace(gen);
      const stats = this.calculateStats(gen);
      this.generationResult(gen, stats);

      const newGenConfigs = [];

      if (this.configuration.keepBest) {
        newGenConfigs.push(gen[0].config);
      }

      while (newGenConfigs.length < this.configuration.size) {
        const selectedPair = this.selectPair(gen);
        const childs = this.crossover(selectedPair[0], selectedPair[1]).map((child) => {
          return this.mutate(child);
        });
        newGenConfigs.push(childs[0]);
        newGenConfigs.push(childs[1]);
      }

      gen = newGenConfigs.map((config) => {
        return {
          config
        };
      })
    }
  }

  terminate = () => {
    this.shouldEnd = true;
  }

  addBestSonCallback = (cb) => {
    this.bestSonCallbacks.push(cb);
  }

  calculateStats = (pop) => {
    const mean = pop.reduce(function (a, b) { return a + b.fitness; }, 0) / pop.length;
    const stdev = Math.sqrt(pop
      .map(function (a) { return (a.fitness - mean) * (a.fitness - mean); })
      .reduce(function (a, b) { return a + b; }, 0) / pop.length);

    return {
      maximum: pop[0].fitness,
      minimum: pop[pop.length - 1].fitness,
      mean: mean,
      stdev: stdev
    };
  }

  seed = () => {
    return MIN_MAX_CONFIGS.map((min_max) => {
      return getRandom(min_max[0], min_max[1]);
    });
  }

  mutate = (config) => {
    const mutationIndex = getRandomInt(0, MIN_MAX_CONFIGS.length);
    return _.adjust((el) => { return getRandom(MIN_MAX_CONFIGS[mutationIndex][0], MIN_MAX_CONFIGS[mutationIndex][1]); }, mutationIndex, config);
  }


  selectPair = (pop) => {
    let tempPop = clone(pop);
    const a = this.select(tempPop);
    const indexOfA = tempPop.indexOf(a);
    tempPop = _.remove(indexOfA, 1, tempPop);
    const b = this.select(tempPop);
    return [a, b];
  }

  select = (pop) => {
    const n = pop.length;
    const a = pop[Math.floor(Math.random() * n)];
    const b = pop[Math.floor(Math.random() * n)];
    const c = pop[Math.floor(Math.random() * n)];
    let best = this.optimizeFitness(a.fitness, b.fitness) ? a : b;
    best = this.optimizeFitness(best.fitness, c.fitness) ? best : c;

    return best.config;
  }

  crossover = (mother, father) => {
    const son = [];
    const daughter = [];
    for (let i = 0; i < MIN_MAX_CONFIGS.length; i++) {
      const selector = getRandomInt(0, 2);
      if (selector === 0) {
        son.push(mother[i]);
        daughter.push(father[i]);
      } else {
        son.push(father[i]);
        daughter.push(mother[i]);
      }
    }
    return [son, daughter];
  }

  compute = (config) => {
    return this.bestLineSplit.calculateLineSplit(config);
  }

  fitness = (config, computed) => {
    // TODO setup way of evaluating results

    // HISTORY
    //  return computed.lineWidth + computed.linesHeight; 
    // -> el problema de esta es que solo le importa que el ancho y alto sean minimos, no como estan repartidos

    //    return (computed.lineWidth / computed.linesHeight) - (this.problemData.width / this.problemData.height);
    // -> esta solo tiene en cuenta que la proporcion sea parecida, y no le importa si deja mucho espacio libre 

    // const wSum = computed.lineWidth + this.problemData.width;
    // const hSum = computed.linesHeight + this.problemData.height;

    // const aW = computed.lineWidth / wSum;
    // const bW = this.problemData.width / wSum;
    // const aH = computed.linesHeight / hSum;
    // const bH = this.problemData.height / hSum;

    // return Math.abs(aW - bW) + Math.abs(aH - bH);

    // TODO probar combinar zoom con dimensionlikelyness para obtener mejroes resultados (la segunda con muy poco valor, solo paradiferenciar entre zooms iguales)
    //    const dimensionlikelyness = (this.problemData.width / this.problemData.height) - (computed.lineWidth / computed.linesHeight);
    //const dimensionlikelyness = (computed.lineWidth / computed.linesHeight) - (this.problemData.width / this.problemData.height);
    //workerLog(dimensionlikelyness, 7);

    const verticalZoom = this.problemData.height / computed.linesHeight;
    const horizontalZoom = this.problemData.width / computed.lineWidth;
    const zoom = Math.min(
      verticalZoom,
      horizontalZoom
    );
    workerLog(zoom, 7);
    return zoom;
    // TODO probar todas estas funciones de fitness!!!!
    // return zoom + (dimensionlikelyness / 100)
  }

  replace = (sortedGen) => {
    return _.take(this.configuration.size, sortedGen);
  }

  optimizeFitness = (a, b) => {
    return a > b;
  }

  generationResult = (population, stats) => {
    workerLog(`COMPUTED AND SORTED GENERATION`, 2);
    workerLog(population, 2);
    const bestSon = population[0];
    const result = bestSon.computed;

    workerLog(`lineIndices: ${result.lineIndices}`, 2);
    workerLog(`lineWidth: ${result.lineWidth}`, 2);
    workerLog(`linesHeight: ${result.linesHeight}`, 2);

    this.bestSonCallbacks.forEach((cb) => {
      cb(result, stats);
    });
  }
}

export default GeneticAlg;
