import _ from 'ramda';

self.onmessage = function (msg) {
  const newCalculation = msg.data;

  var bestLineSplit = new BestLineSplit(newCalculation.width, newCalculation.height, newCalculation.textLineHeight, newCalculation.wordLengths, newCalculation.spaceLength);
  bestLineSplit.calculateLineSplit();
  const bestSon = {
    lineIndices: bestLineSplit.getLineIndices(),
    lineWidth: bestLineSplit.getCurrentMaxTextWidth(),
    linesHeight: bestLineSplit.getCurrentTextHeight()
  }

  workerLog(`lineIndices: ${bestSon.lineIndices}`);
  workerLog(`lineWidth: ${bestSon.lineWidth}`);
  workerLog(`linesHeight: ${bestSon.linesHeight}`);

  postMessage({
    type: 'bestSon',
    data: bestSon
  });
}

// In: 
// {
//   textLineHeight: 8
//   width: 80,
//   height: 555,
//   wordLengths: [ 55, 32, 22, 22, 55, 55 ],
//   spaceLength: 3,
// }

// Out:
// { 
//   lineIndices: [0, 2, 4, 5],
//   lineWidth: 55,
//   lineHeight: 44
// }
// 


// Calculate initial minLines:
// EQ1: width / height =(ideally) linesWidth / linesHeight
// EQ2: A(min) = linesHeight * linesWidth

// EQ3: (MIN AREA) A(min) ~= textLineHeight * (wordLengths * words + spaceLength * (words - 1))

// D = width / height = linesWidth / linesHeigth
// A(min) = textLineHeight * (wordLengths * words + spaceLength * (words - 1)) = linesHeight * linesWidth

// linesWidth = D * linesHeight
// linesWidth = A(min) / linesHeight
// D * linesHeight = A(min) / linesHeight
// A(min) / D = linesHeight^2

const HEURISTIC_LINES_WEIGHT = 2;
const HEURISTIC_EXCESS_WEIGHT = 0.1;
const HEURISTIC_RANDOM_THRESHOLD = 0.5;
const HEURISTIC_BOOST = 10;

function BestLineSplit(width, height, textLineHeight, wordLengths, spaceLength) {
  this.width = width;
  this.height = height;
  this.textLineHeight = textLineHeight;
  this.wordLengths = wordLengths;
  this.spaceLength = spaceLength;
  this.lineIndices = [];
  this.currentMaxTextWidth = 0;
  this.currentMaxLinesNumber = 0;
  this.currentMaxTextHeight = 0;
}

// D(ideal) = width / height
// if the result dimension is this one, then the zoom can be the max possible
BestLineSplit.prototype.getIdealDimensions = function () {
  return this.width / this.height;
}

BestLineSplit.prototype.getCurrentTextHeight = function () {
  return (this.lineIndices.length) * this.textLineHeight;
}

BestLineSplit.prototype.getCurrentMaxTextWidth = function () {
  return this.currentMaxTextWidth;
}

BestLineSplit.prototype.getCurrentMaxTextHeight = function () {
  return this.currentMaxTextHeight;
}

BestLineSplit.prototype.getLineIndices = function () {
  return this.lineIndices;
}

BestLineSplit.prototype.getLengthOfWords = function (start = 0, end = this.wordLengths.length) {
  const sliceOfLengths = _.slice(start, end, this.wordLengths);
  return sliceOfLengths.reduce((tot, len) => { return tot + len }, 0) + this.spaceLength * (sliceOfLengths.length - 1)
}

// A(min) = textLineHeight * (wordLengths * words + spaceLength * (words - 1))
// TODO should take into account that spaces at the end of lines are not included into end result ?
BestLineSplit.prototype.getMinTextArea = function () {
  return this.textLineHeight * this.getLengthOfWords();
}

BestLineSplit.prototype.increaseCurrentMaxTextWidth = function (maxTextWidth) {
  this.currentMaxTextWidth = maxTextWidth;
  this.currentMaxTextHeight = maxTextWidth / this.getIdealDimensions();
  this.currentMaxLinesNumber = Math.ceil(this.currentMaxTextHeight / this.textLineHeight);
}

BestLineSplit.prototype.heuristicLineSplit = function (heuristic, lineNr, wordNr) {
  // - make impossible to surpass max nr of lines for this width
  // - if linesFree > linesLeft: there is extra space below, so a split is preferred
  // - if linesLeft > linesFree: there is not enough space below, so the max width should increase (no split)
  const linesFree = this.currentMaxLinesNumber - lineNr + 1;
  const widthLeft = this.getLengthOfWords(wordNr);
  const linesLeft = Math.ceil(widthLeft / this.currentMaxTextWidth);

  // goes from -1 to 1; if positive: prefer split
  const linesDiffNormalized = (linesFree - linesLeft) / (linesFree + linesLeft);

  workerLog(`linesFree: ${linesFree}`)
  workerLog(`linesLeft: ${linesLeft}`)
  workerLog(`widthLeft: ${widthLeft}`)
  workerLog(`linesDiffNormalized: ${linesDiffNormalized}`)

  // - the closer linesFree is to 0, the stronger we enforce this (if it's one, we enforce always)
  if (linesFree === 0) {
    return -1;
  } else {
    const linesHeuristicAfterLinesFreeWeight = (linesDiffNormalized * HEURISTIC_LINES_WEIGHT / linesFree);
    workerLog(`linesHeuristicAfterLinesFreeWeight: ${linesHeuristicAfterLinesFreeWeight}`)
    return linesHeuristicAfterLinesFreeWeight + heuristic;
  }
}

BestLineSplit.prototype.heuristicExcess = function (heuristic, currentTextWidth, nextTextWidth) {
  // - Si añadimos mucho o si dejamos mucho hueco libre ambos casos son malos
  const excessOnPut = nextTextWidth - this.currentMaxTextWidth;
  const incessOnSplit = this.currentMaxTextWidth - currentTextWidth;

  // si diff es positivo, es mejor hacer SPLIT ya que hay menos excess
  let diffNormalized = (excessOnPut - incessOnSplit) / (excessOnPut + incessOnSplit); 
  diffNormalized *= HEURISTIC_EXCESS_WEIGHT;
  
  return heuristic + diffNormalized;
}

BestLineSplit.prototype.calculateLineSplit = function () {
  const minTextArea = this.getMinTextArea();
  const idealDimensions = this.getIdealDimensions();
  const minTextHeight = Math.sqrt(minTextArea / idealDimensions);
  const minLinesNumber = Math.ceil(minTextHeight / this.textLineHeight);

  const minTextWidth = minTextArea / (minLinesNumber * this.textLineHeight);

  this.increaseCurrentMaxTextWidth(minTextWidth);

  let wordIndex = 0;
  while (wordIndex < this.wordLengths.length) {
    this.lineIndices.push(wordIndex);
    const lineNr = this.lineIndices.length - 1;
    workerLog(`\n\nSTARTING ITERATION FOR LINE: ${lineNr}\n\n`);

    let wordsAdded = 0;
    let currentTextWidth = 0;

    for (let index = wordIndex; index < this.wordLengths.length; index++) {
      const wordNr = index;
      workerLog(`\nPROCESSING WORD: ${wordNr}\n`)
      const value = this.wordLengths[index];

      let nextTextWidth;
      if (index === 0) nextTextWidth = value;
      else nextTextWidth = currentTextWidth + this.spaceLength + value;

      workerLog(`nextTextWidth: ${nextTextWidth}`)
      workerLog(`currentMaxTextWidth: ${this.currentMaxTextWidth}`)

      // DECISION LOCAL
      // here we decide if we want to add this word to the line or split to next line
      // TODO use heuristic here

      if (nextTextWidth <= this.currentMaxTextWidth) {
        // word is added to line
        workerLog('Word added to line automatically');
        wordsAdded += 1;
        currentTextWidth = nextTextWidth;
      } else {
        workerLog('Deciding with heuristic')

        // line should be split or currentMaxTextWidth needs to increase
        // TODO this is temporal heristic, good one should depend on lines left
        // HEURISTIC DESIGN:
        //  1: split, -1: put
        let heuristic = 0;
        workerLog(`Heuristic start: ${heuristic}`);

        heuristic = this.heuristicLineSplit(heuristic, lineNr, wordNr);
        workerLog(`Heuristic after line split: ${heuristic}`);

        heuristic = this.heuristicExcess(heuristic, currentTextWidth, nextTextWidth);
        workerLog(`Heuristic after excess: ${heuristic}`);

        // - put always at least 1 word in the line 
        if (wordsAdded === 0) {
          heuristic = -1;
        }

        // boost by some value
        heuristic *= HEURISTIC_BOOST;

        workerLog(`FINAL HEURISTIC: ${heuristic}`)
        if (heuristic > getRandom(-HEURISTIC_RANDOM_THRESHOLD, HEURISTIC_RANDOM_THRESHOLD)) {
          workerLog('Line Split (heuristic decision)');
          break;
        } else {
          workerLog('Word added to line (heuristic decision)');
          // word added to line + currentMaxTextWidth increases
          this.increaseCurrentMaxTextWidth(nextTextWidth);
          wordsAdded += 1;
          currentTextWidth = nextTextWidth;
        }
      }
    }

    wordIndex += wordsAdded;
  }
}

function workerLog(data) {
  postMessage({
    type: 'log',
    data
  });
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

// TODO falta impedir que se supere el max num de lineas (con heuristica en decision)