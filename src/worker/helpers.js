
export function workerLog(data) {
  postMessage({
    type: 'log',
    data
  });
}

export function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export function clone(obj) {
  if (obj == null || typeof obj !== "object")
    return obj;

  return JSON.parse(JSON.stringify(obj));
};