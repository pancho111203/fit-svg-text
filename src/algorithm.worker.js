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
    workerLog(`STATS`, 4);
    workerLog(stats, 4);
    workerLog(`bestSon`, 4);
    workerLog(bestSon, 4);
    postMessage({
      type: 'bestSon',
      data: bestSon
    });
  });
  genetic.evolve();
}
