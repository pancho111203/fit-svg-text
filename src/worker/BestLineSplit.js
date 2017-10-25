import _ from 'ramda';

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
    const linesDiff = linesFree - linesLeft;
    let linesDiffFunction;
    if (linesDiff < 0) {
      linesDiffFunction = Math.atan(linesDiff) - 1
    } else {
      linesDiffFunction = Math.atan(linesDiff) + 1
    }

    return heuristic + (linesDiffFunction * config[0]);
  }

  heuristicExcess = (heuristic, currentTextWidth, currentMaxTextWidth, nextTextWidth, config) => {
    // - Si añadimos mucho o si dejamos mucho hueco libre ambos casos son malos
    const excessOnPut = nextTextWidth - currentMaxTextWidth;
    const incessOnSplit = currentMaxTextWidth - currentTextWidth;

    // si diff es positivo, es mejor hacer SPLIT ya que hay menos excess
    let diffNormalized = (excessOnPut - incessOnSplit) / (excessOnPut + incessOnSplit);

    return heuristic + (diffNormalized * config[1]);
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

      let wordsAdded = 0;
      let currentTextWidth = 0;

      for (let index = wordIndex; index < this.wordLengths.length; index++) {
        const wordNr = index;
        const value = this.wordLengths[index];

        let nextTextWidth;
        if (index === 0) nextTextWidth = value;
        else nextTextWidth = currentTextWidth + this.spaceLength + value;

        if (nextTextWidth <= currentMaxTextWidth) {
          // word is added to line
          wordsAdded += 1;
          currentTextWidth = nextTextWidth;
        } else {
          // HEURISTIC DESIGN:
          //  1: split, -1: put
          let heuristic = 0;

          heuristic = this.heuristicLineSplit(heuristic, lineNr, currentMaxLinesNumber, currentMaxTextWidth, wordNr, config);

          heuristic = this.heuristicExcess(heuristic, currentTextWidth, currentMaxTextWidth, nextTextWidth, config);

          // - put always at least 1 word in the line 
          if (wordsAdded === 0) {
            heuristic = -1;
          }

          if (heuristic > 0) {
             break;
          } else {
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
    const verticalZoom = this.height / linesHeight;
    const horizontalZoom = this.width / lineWidth;
    const zoom = Math.min(
      verticalZoom,
      horizontalZoom
    );
    return zoom;
  }
}

export default BestLineSplit;
