import React from 'react';
import _ from 'ramda';
import WorkerAlg from './algorithm.worker';
import ResultGraphGenetic from './ResultGraphGenetic';
import ResultGraphSimulated from './ResultGraphSimulated';
import ResultSingleRun from './ResultSingleRun';

class FitText extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.referenceElement = null;

    this.wordLengths = null;
    this.spaceLength = null;

    this.state = {
      bestSon: null,
      stats: [],
      bestConfig: null
    }

    if (this.props.resultsGatherer) this.props.resultsGatherer.link();

    this.worker = new WorkerAlg;
    this.worker.onmessage = (e) => {
      const receivedObject = e.data;

      if (receivedObject.type === 'bestSon') {
        const bestSon = receivedObject.data;
        const recStat = receivedObject.stats;
        const recConfig = receivedObject.config;
        if (bestSon.lineIndices && bestSon.lineWidth && bestSon.linesHeight) {
          const i = this.state.stats.length + 1;
          const newStats = _.append({
            ...recStat,
            index: i
          }, this.state.stats);
          this.setState({
            bestSon,
            stats: newStats,
            bestConfig: recConfig
          });
        }
      } else if (receivedObject.type === 'log') {
        console.dir(receivedObject.data);
      } else if (receivedObject.type === 'finished') {
        // TODO calculate time from start to finish
        // TODO calculate how close it is to optimum
        if (this.props.resultsGatherer) {
          this.props.resultsGatherer.addResult({
            bestSon: this.state.bestSon,
            bestConfig: this.state.bestConfig,
            bestFitness: this.state.stats[this.state.stats.length - 1].maximum
          });
        }
      }
    }
  }

  componentDidMount() {
    if (this.referenceElement) {
      this.computeWordLengths(this.props.text);
      this.computeSpaceLength(this.props.text);
      this.sendValuesToAlgorithm({
        textLineHeight: this.referenceElement.getBBox().height,
        width: this.props.width,
        height: this.props.height,
        wordLengths: this.wordLengths,
        spaceLength: this.spaceLength,
      });
    }
  }

  componentDidUpdate(newProps) { // call didupdate to let the referenceElement update with new values
    if (this.referenceElement) {
      if (newProps.text !== this.props.text || newProps.width !== this.props.width || newProps.height !== this.props.height) {
        this.setState({
          bestSon: null
        }, () => {
          this.computeWordLengths(newProps.text, this.referenceElement);
          this.computeSpaceLength(newProps.text, this.referenceElement);
          this.sendValuesToAlgorithm({
            textLineHeight: this.referenceElement.getBBox().height,
            width: newProps.width,
            height: newProps.height,
            wordLengths: this.wordLengths,
            spaceLength: this.spaceLength,
          });
        });
      }
    }
  }

  computeWordLengths = () => {
    const text = this.referenceElement.textContent;
    const regex = /\w+/g;
    const result = [];
    let wordMatch;
    while ((wordMatch = regex.exec(text))) {
      try {
        const width = this.referenceElement.getSubStringLength(
          wordMatch.index,
          wordMatch[0].length
        );
        result.push(width);
      } catch (e) {
        console.log(e);
      }
    }

    this.wordLengths = result;
  }

  computeSpaceLength = () => {
    const text = this.referenceElement.textContent;
    const indexOfSpace = text.indexOf(' ');
    if (indexOfSpace !== -1) {
      try {
        this.spaceLength = this.referenceElement.getSubStringLength(
          indexOfSpace,
          1
        );
      } catch (e) {
        this.spaceLength = 0;
      }
    } else {
      this.spaceLength = 0;
    }
  }

  sendValuesToAlgorithm = (data) => {
    const msg = {
      data,
      algorithm: this.props.algorithm,
      config: this.props.config || null
    }
    this.worker.postMessage(msg);
  }


  render() {
    const { width, height, text } = this.props;
    const { bestSon } = this.state;

    let zoom = null;
    let lines = null;
    if (bestSon) {
      const contentHeight = bestSon.linesHeight;

      const verticalZoom = height / Math.ceil(contentHeight);
      const horizontalZoom = width / Math.ceil(bestSon.lineWidth);
      zoom = Math.min(
        verticalZoom,
        horizontalZoom
      );

      lines = [];
      const regex = /\w+/g;
      let wordMatch;
      let i = 0;
      let j = 1;
      let currentLine = '';
      while ((wordMatch = regex.exec(text))) {
        if (currentLine.length > 0) {
          currentLine = currentLine + ' ' + wordMatch[0];
        } else {
          currentLine = wordMatch[0];
        }

        i++;

        if (i === bestSon.lineIndices[j]) { // should split on next word
          lines.push(currentLine);
          currentLine = '';
          j++;
        }
      }
      lines.push(currentLine);
    }

    let title = '';
    if (this.props.algorithm === 'simulated') {
      title = 'Enfriamiento Simulado';
    } else if (this.props.algorithm === 'genetic') {
      title = 'Algoritmo Genético';
    } else if (this.props.algorithm === 'singlerun') {
      title = 'Sin metaheuristica';
    }
    return (
      <div style={styles.container}>
        <h2>{title}</h2>
        <div style={styles.innerContainer}>
          <svg width={width} height={height}>
            <g>
              <rect x="0" y="0" width={width} height={height} fill="#D4E5C3" />
              <text
                x="0"
                y="0"
                style={{ lineHeight: '5px' }}
                stroke="#000"
                dy="1em"
                ref={c => (this.referenceElement = c)}
                transform={zoom ? `scale(${zoom}, ${zoom})` : ''}
              >
                {lines ? lines.map((line, i) =>
                  <tspan key={i} x={0} dy="1em">
                    {line}
                  </tspan>
                ) : (
                    <tspan x={0} dy="1em">
                      {text}
                    </tspan>
                  )
                }
              </text>
            </g>
          </svg>
          {this.props.showResultGraph && this.props.algorithm === 'genetic' ? <ResultGraphGenetic style={styles.graphStyle} stats={this.state.stats} /> : null}
          {this.props.showResultGraph && this.props.algorithm === 'simulated' ? <ResultGraphSimulated style={styles.graphStyle} stats={this.state.stats} /> : null}
          {this.props.showResultGraph && this.props.algorithm === 'singlerun' ? <ResultSingleRun style={styles.graphStyle} stats={this.state.stats} /> : null}
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 80
  },
  innerContainer: {
    display: 'flex'
  },
  graphStyle: {
    marginLeft: 80
  }
}

FitText.defaultProps = {
  algorithm: 'genetic'
};

export default FitText;

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
