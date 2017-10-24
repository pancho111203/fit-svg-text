import React from 'react';
import _ from 'ramda';
import WorkerAlg from './algorithm2.worker';

class FitText extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.referenceElement = null;

    this.wordLengths = null;
    this.spaceLength = null;

    this.state = {
      bestSon: null
    }

    this.worker = new WorkerAlg;
    this.worker.onmessage = (e) => {
      const receivedObject = e.data;

      if (receivedObject.type === 'bestSon') {
        const bestSon = receivedObject.data;
        if (bestSon.lineIndices && bestSon.lineWidth && bestSon.linesHeight) {
          this.setState({
            bestSon
          });
        }
      } else if (receivedObject.type === 'log') {
        console.dir(receivedObject.data);
      }
    }
  }

  componentDidMount() {
    if (this.referenceElement) {
      this.computeWordLengths(this.props.text);
      this.computeSpaceLength(this.props.text);
      console.log({
        textLineHeight: this.referenceElement.getBBox().height,
        width: this.props.width,
        height: this.props.height,
        wordLengths: this.wordLengths,
        spaceLength: this.spaceLength,
      });
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

    let zoom = null;
    let lines = null;
    if (bestSon) {
      const contentHeight = bestSon.linesHeight;

      const verticalZoom = height / Math.ceil(contentHeight);
      const horizontalZoom = width / Math.ceil(bestSon.lineWidth);
      console.log(bestSon);
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

    return (
      <div>
        <svg width={width} height={height}>
          <g>
            <rect x="0" y="0" width={width} height={height} fill="#f99" />
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
//   lineIndices: [0, 2, 4, 5],
//   lineWidth: 55,
//   lineHeight: 44
// }
// 
