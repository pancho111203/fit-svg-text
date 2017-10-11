import React from 'react';
import _ from 'ramda';
const WorkerAlg = require('worker-loader!./algorithm_worker');

class FitText extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.referenceElement = null;
    this.zoomedElement = null;

    this.wordLengths = null;
    this.spaceLength = null;

    this.state = {
      bestSon: {
        zoom: 3.508771929824561,
        lines: ["Hello", "how", "are you", "im good"] // TODO make this array only show indeces (not be text specific)
      }
    }

    this.worker = new WorkerAlg;
    this.worker.onmessage = (msg) => {
      console.log(msg);
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
        if (newProps.text !== this.props.text) {
          this.computeWordLengths(newProps.text, this.referenceElement);
          this.computeSpaceLength(newProps.text, this.referenceElement);
        }

        this.sendValuesToAlgorithm({
          textLineHeight: this.referenceElement.getBBox().height,
          width: newProps.width,
          height: newProps.height,
          wordLengths: this.wordLengths,
          spaceLength: this.spaceLength,
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
      const width = this.referenceElement.getSubStringLength(
        wordMatch.index,
        wordMatch[0].length
      );
      result.push(width);
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
    this.worker.postMessage(data);
  }


  render() {
    const { width, height, text } = this.props;
    const { bestSon } = this.state;
    return (
      <div>
        <svg width={width} height={height}>
          <g>
            <rect x="0" y="0" width={width} height={height} fill="#f99" />
            <text
              x="0"
              y="0"
              stroke="#000"
              dy="1em"
              ref={c => (this.referenceElement = c)}
            >
              <tspan x={0} dy="1em">
                {text}
              </tspan>
            </text>
          </g>
        </svg>
        <br />
        <svg width={width} height={height}>
          <g>
            <rect x="0" y="0" width={width} height={height} fill="#f99" />
            <text
              x="0"
              y="0"
              stroke="#000"
              dy="1em"
              ref={c => (this.zoomedElement = c)}
              transform={_.prop('bestSon.zoom', this.state) ? `scale(${bestSon.zoom}, ${bestSon.zoom})` : ''}
            >
              {_.prop('bestSon.lines', this.state) ? bestSon.lines.map((line, i) =>
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
      </div>
    );
  }
}

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
//   lineIndices: [0, 2, 4, 5] 
// }
