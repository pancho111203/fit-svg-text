import GeneticAlg from './worker/GeneticAlg';
import SimulatedAnnealing from './worker/SimulatedAnnealing';
import BestLineSplit from './worker/BestLineSplit';
import { DEFAULT_CONFIG } from './worker/config';

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
    genetic.addBestSonCallback((bestSon, stats, config, isFinished) => {
      if (isFinished) {
        postMessage({
          type: 'finished'
        });
        return;
      }
      postMessage({
        type: 'bestSon',
        data: bestSon,
        stats,
        config
      });
    });
    genetic.evolve();
  } else if (algorithmType === 'simulated') {
    simulated = new SimulatedAnnealing(problemData);
    simulated.addBestSonCallback((bestSon, stats, config, isFinished) => {
      if (isFinished) {
        postMessage({
          type: 'finished'
        });
        return;
      }
      postMessage({
        type: 'bestSon',
        data: bestSon,
        stats,
        config
      });
    });
    simulated.start();
  } else if (algorithmType === 'singlerun') {
    const config = problemData.config || DEFAULT_CONFIG;
    const bestLineSplit = new BestLineSplit(problemData.width, problemData.height, problemData.textLineHeight, problemData.wordLengths, problemData.spaceLength);
    const res = bestLineSplit.calculateLineSplit(config);
    const fitness = bestLineSplit.fitness(res.linesHeight, res.lineWidth);

    postMessage({
      type: 'bestSon',
      data: res,
      config,
      stats: { maximum: fitness }
    });

  }
}
