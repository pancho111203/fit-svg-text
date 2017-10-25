import GeneticAlg from './worker/GeneticAlg';
import SimulatedAnnealing from './worker/SimulatedAnnealing';

import { workerLog } from './worker/helpers';
let genetic = null;
let simulated = null;
self.onmessage = function (msg) {
  const algorithmType = msg.data.algorithm;
  const problemData = msg.data.data;
  if (genetic) {
    genetic.terminate();
    genetic = null;
  }
  if (simulated) {
    simulated.terminate();
    simulated = null;
  }

  if (algorithmType === 'genetic') {
    genetic = new GeneticAlg(problemData);
    genetic.addBestSonCallback((bestSon, stats) => {
      postMessage({
        type: 'bestSon',
        data: bestSon,
        stats
      });
    });
    genetic.evolve();
  } else if (algorithmType === 'simulated') {
    simulated = new SimulatedAnnealing(problemData);
    simulated.addBestSonCallback((bestSon, stats) => {
      postMessage({
        type: 'bestSon',
        data: bestSon,
        stats
      });
    });
    simulated.start();
  }
}
