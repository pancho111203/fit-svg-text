import _ from 'ramda';

import BestLineSplit from './BestLineSplit';
import { getRandom, getRandomInt, clone } from './helpers';
import { DEFAULT_CONFIG, MIN_MAX_CONFIGS } from './config';

class SimmulatedAnnealing {
  constructor(problemData) {
    this.bestSonCallbacks = [];
    this.problemData = problemData;
    this.shouldEnd = false;

    this.configuration = {
      initialTemperature: 100,
      maxIterations: 500
    }

    this.bestLineSplit = new BestLineSplit(this.problemData.width, this.problemData.height, this.problemData.textLineHeight, this.problemData.wordLengths, this.problemData.spaceLength);
  }

  terminate = () => {
    this.shouldEnd = true;
  }

  addBestSonCallback = (cb) => {
    this.bestSonCallbacks.push(cb);
  }

  generateIndividual = (config) => {
    const computedSolution = this.bestLineSplit.calculateLineSplit(config);
    const fitness = this.bestLineSplit.fitness(computedSolution.linesHeight, computedSolution.lineWidth);
    return {
      config,
      computed: computedSolution,
      fitness
    };
  }

  start = () => {
    let currentIndividual = this.generateIndividual(this.seed());
    let bestIndividual = currentIndividual;
    this.foundNewBest(bestIndividual);
    let temperature = this.configuration.initialTemperature;

    // TODO make it stop if bestInd didnt change in last x iterations??
    for (let i = 0; this.shouldContinue(i, temperature); i++) {
      const successor = this.generateIndividual(this.generateSuccessor(currentIndividual.config));
      const delta = currentIndividual.fitness - successor.fitness;
      if (delta < 0) {
        currentIndividual = successor;
      } else {
        if (this.shouldAcceptSuccessor(temperature, delta)) {
          currentIndividual = successor;
        }
        temperature = this.coolTemperature(i, temperature);
      }
      if (bestIndividual.fitness < currentIndividual.fitness) {
        bestIndividual = currentIndividual;
        this.foundNewBest(bestIndividual);
      }
    }

    this.sendFinished();
  }

  shouldContinue = (iteration, temperature) => {
    // TODO test this
    if (iteration < this.configuration.maxIterations && !this.shouldEnd && temperature > 0.5) {
      return true;
    }
    return false;
  }

  seed = () => {
    // TODO maybe instead of default config, initial should be random?? try
    return DEFAULT_CONFIG;
  }

  shouldAcceptSuccessor = (temperature, delta) => {
    var C = Math.exp(-delta / temperature);
    var R = Math.random();

    if (R < C) {
      return true;
    }

    return false;
  }

  generateSuccessor = (config) => {
    // TODO improve this https://www.researchgate.net/post/Which_algorithm_can_be_used_to_optimize_four_parameters
    // Right now it only takes one parameter randomly and changes it randomly
    const mutationIndex = getRandomInt(0, MIN_MAX_CONFIGS.length);
    return _.adjust((el) => { return getRandom(MIN_MAX_CONFIGS[mutationIndex][0], MIN_MAX_CONFIGS[mutationIndex][1]); }, mutationIndex, config);
  }

  coolTemperature = (iteration, temperature) => {
    // TODO probar diferentes versiones

    // a) α(i, T) = k*Ti, con 0<k<1, típicamente {0,8, 0,99}
    const coolingFactor = 0.9;
    return coolingFactor * temperature;

    // b) α (i, T) = Ti/ (1 + kTi), k>0 y con valor pequeño.
    // const coolingFactor = 0.1;
    // return temperature / (1 + (coolingFactor * temperature));
  }

  foundNewBest = (individual) => {
    if (this.shouldEnd) return;

    const result = individual.computed;

    const stats = { maximum: individual.fitness }
    this.bestSonCallbacks.forEach((cb) => {
      cb(result, stats, individual.config);
    });
  }

  sendFinished = () => {
    this.bestSonCallbacks.forEach((cb) => {
      cb(null, null, null, true);
    });
  }
}

export default SimmulatedAnnealing;
