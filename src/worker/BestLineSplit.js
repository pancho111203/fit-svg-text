import _ from 'ramda';
import { workerLog, getRandom } from './helpers';

class BestLineSplit {
  constructor(width, height, textLineHeight, wordLengths, spaceLength) {
    this.width = width;
    this.height = height;
    this.textLineHeight = textLineHeight;
    this.wordLengths = wordLengths;
    this.spaceLength = spaceLength;

    this.initialMaxWidth = this.calculateInitialMaxWidth();
  }

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
  calculateInitialMaxWidth = () => {
    const minTextArea = this.getMinTextArea();
    const idealDimensions = this.getIdealDimensions();
    const minTextHeight = Math.sqrt(minTextArea / idealDimensions);
    const minLinesNumber = Math.ceil(minTextHeight / this.textLineHeight);

    return minTextArea / (minLinesNumber * this.textLineHeight);
  }

  // D(ideal) = width / height
  // if the result dimension is this one, then the zoom can be the max possible
  getIdealDimensions = () => {
    return this.width / this.height;
  }

  getLengthOfWords = (start = 0, end = this.wordLengths.length) => {
    const sliceOfLengths = _.slice(start, end, this.wordLengths);
    return sliceOfLengths.reduce((tot, len) => { return tot + len }, 0) + this.spaceLength * (sliceOfLengths.length - 1);
  }

  // A(min) = textLineHeight * (wordLengths * words + spaceLength * (words - 1))
  getMinTextArea = () => {
    return this.textLineHeight * this.getLengthOfWords();
  }

  heuristicLineSplit = (heuristic, lineNr, currentMaxLinesNumber, currentMaxTextWidth, wordNr, config) => {
    // - make impossible to surpass max nr of lines for this width
    // - if linesFree > linesLeft: there is extra space below, so a split is preferred
    // - if linesLeft > linesFree: there is not enough space below, so the max width should increase (no split)
    const linesFree = currentMaxLinesNumber - lineNr + 1;
    const widthLeft = this.getLengthOfWords(wordNr);
    const linesLeft = Math.ceil(widthLeft / currentMaxTextWidth);

    // goes from -1 to 1; if positive: prefer split
    const linesDiffNormalized = (linesFree - linesLeft) / (linesFree + linesLeft);

    workerLog(`linesFree: ${linesFree}`, 0)
    workerLog(`linesLeft: ${linesLeft}`, 0)
    workerLog(`widthLeft: ${widthLeft}`, 0)
    workerLog(`linesDiffNormalized: ${linesDiffNormalized}`, 0)

    // - the closer linesFree is to 0, the stronger we enforce this (if it's one, we enforce always)
    if (linesFree === 0) {
      return -1;
    } else {
      const linesHeuristicAfterLinesFreeWeight = (linesDiffNormalized * config[0] / linesFree);
      workerLog(`linesHeuristicAfterLinesFreeWeight: ${linesHeuristicAfterLinesFreeWeight}`)
      return linesHeuristicAfterLinesFreeWeight + heuristic;
    }
  }

  heuristicExcess = (heuristic, currentTextWidth, currentMaxTextWidth, nextTextWidth, config) => {
    // - Si añadimos mucho o si dejamos mucho hueco libre ambos casos son malos
    const excessOnPut = nextTextWidth - currentMaxTextWidth;
    const incessOnSplit = currentMaxTextWidth - currentTextWidth;

    // si diff es positivo, es mejor hacer SPLIT ya que hay menos excess
    let diffNormalized = (excessOnPut - incessOnSplit) / (excessOnPut + incessOnSplit);
    diffNormalized *= config[1];

    return heuristic + diffNormalized;
  }

  calculateLineSplit = (config) => {
    const lineIndices = [];
    let currentMaxTextWidth = this.initialMaxWidth;
    let currentMaxTextHeight = currentMaxTextWidth / this.getIdealDimensions();
    let currentMaxLinesNumber = Math.ceil(currentMaxTextHeight / this.textLineHeight);
    let wordIndex = 0;

    while (wordIndex < this.wordLengths.length) {
      lineIndices.push(wordIndex);
      const lineNr = lineIndices.length - 1;
      workerLog(`\n\nSTARTING ITERATION FOR LINE: ${lineNr}\n\n`, 0);

      let wordsAdded = 0;
      let currentTextWidth = 0;

      for (let index = wordIndex; index < this.wordLengths.length; index++) {
        const wordNr = index;
        workerLog(`\nPROCESSING WORD: ${wordNr}\n`, 0)
        const value = this.wordLengths[index];

        let nextTextWidth;
        if (index === 0) nextTextWidth = value;
        else nextTextWidth = currentTextWidth + this.spaceLength + value;

        workerLog(`nextTextWidth: ${nextTextWidth}`, 0)
        workerLog(`currentMaxTextWidth: ${currentMaxTextWidth}`, 0)

        if (nextTextWidth <= currentMaxTextWidth) {
          // word is added to line
          workerLog('Word added to line automatically', 0);
          wordsAdded += 1;
          currentTextWidth = nextTextWidth;
        } else {
          workerLog('Deciding with heuristic', 0)

          // HEURISTIC DESIGN:
          //  1: split, -1: put
          let heuristic = 0;
          workerLog(`Heuristic start: ${heuristic}`, 0);

          heuristic = this.heuristicLineSplit(heuristic, lineNr, currentMaxLinesNumber, currentMaxTextWidth, wordNr, config);
          workerLog(`Heuristic after line split: ${heuristic}`, 0);

          heuristic = this.heuristicExcess(heuristic, currentTextWidth, currentMaxTextWidth, nextTextWidth, config);
          workerLog(`Heuristic after excess: ${heuristic}`, 0);

          // - put always at least 1 word in the line 
          if (wordsAdded === 0) {
            heuristic = -1;
          }

          // boost by some value
          heuristic *= config[3];

          workerLog(`FINAL HEURISTIC: ${heuristic}`, 0)
          if (heuristic > 0.5) {
            workerLog('Line Split (heuristic decision)', 0);
            break;
          } else {
            workerLog('Word added to line (heuristic decision)', 0);
            // word added to line + currentMaxTextWidth increases
            currentMaxTextWidth = nextTextWidth;
            currentMaxTextHeight = currentMaxTextWidth / this.getIdealDimensions();
            currentMaxLinesNumber = Math.ceil(currentMaxTextHeight / this.textLineHeight);
            wordsAdded += 1;
            currentTextWidth = nextTextWidth;
          }
        }
      }

      wordIndex += wordsAdded;
    }

    return {
      lineIndices: lineIndices,
      lineWidth: currentMaxTextWidth,
      linesHeight: lineIndices.length * this.textLineHeight
    }
  }

  fitness = (linesHeight, lineWidth) => {
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
    // computed.lineWidth / computed.linesHeight = this.problemData.width / this.problemData.height
    //    const dimensionlikelyness = (computed.lineWidth / computed.linesHeight) - (this.problemData.width / this.problemData.height);

    const verticalZoom = this.height / linesHeight;
    const horizontalZoom = this.width / lineWidth;
    const zoom = Math.min(
      verticalZoom,
      horizontalZoom
    );
    workerLog(`zoom: ${zoom}`, 7);

    const spaceFreeHeight = this.height - (zoom * linesHeight);
    const spaceFreeWidth = this.width - (zoom * lineWidth);

    const spaceFreeSumWeighted = (spaceFreeHeight + spaceFreeWidth) / 10000;

    workerLog(`spaceFreeHeight: ${spaceFreeHeight}`, 7);
    workerLog(`spaceFreeWidth: ${spaceFreeWidth}`, 7);
    workerLog(`spaceFreeSumWeighted: ${spaceFreeSumWeighted}`, 7);
    workerLog(`total: ${zoom - spaceFreeSumWeighted}`, 7);
    return zoom - spaceFreeSumWeighted;
  }
}

export default BestLineSplit;
