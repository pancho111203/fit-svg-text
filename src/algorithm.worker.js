import GeneticAlg from './worker/GeneticAlg';
import { workerLog } from './worker/helpers';
let genetic = null;

self.onmessage = function (msg) {
  const problemData = msg.data;
  if (genetic) {
    genetic.terminate();
    genetic = null;
  }

  genetic = new GeneticAlg(problemData);
  genetic.addBestSonCallback((bestSon, stats) => {
    postMessage({
      type: 'bestSon',
      data: bestSon,
      stats
    });
  });
  genetic.evolve();
}
