// simple store
// rushed due to lack of time
class ResultsGatherer {
  constructor() {
    this.owners = 0;
    this.callbacks = [];
    this.results = [];
  }

  addStoreListener = (cb) => {
    this.callbacks.push(cb);
  }

  link = () => {
    this.owners++;
  }

  addResult = (result) => {
    this.results.push(result);
    if (this.results.length >= this.owners) {
      this.exec();
    }
  }

  exec = () => {
    this.callbacks.forEach((cb) => {
      cb(this.results);
    })
    this.results = [];
  }
}

export default ResultsGatherer;
