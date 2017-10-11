import React from 'react';
import getCompositions from './compositions';

export default class FitSVGText extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      zoom: 1,
      textLines: [this.props.text]
    };
  }

  componentDidMount() {
    this.fitText();
  }

  componentWillUpdate(newProps) {
    //this.fitText();
  }

  findWordIndices = str => {
    const regex = /\w+/g;

    const result = [];
    let match;
    while ((match = regex.exec(str))) {
      const start = match.index;
      const end = start + match[0].length;

      result.push([start, end]);
    }

    return result;
  };

  fitText() {
    // find the indices where words are, e.g. "hi you" => [[0, 1], [3, 5]]
    const indices = this.findWordIndices(this.props.text);

    // create all possible ways this can be split into lines, e.g. [[[[[0, 1]], [[3, 5]]], [[0, 1], [3, 5]]]
    const compositions = getCompositions(indices);

    const containerHeight = this.props.height;
    const containerWidth = this.props.width;

    const textHeight = this.textElement.getBBox().height;
    const wordWidths = [];

    compositions.forEach(lines => {
      lines.forEach(words => {
        const startOfFirstWord = words[0][0];
        const endOfLastWord = words[words.length - 1][1];
        const numberOfCharacters = endOfLastWord - startOfFirstWord;

        const width = this.textElement.getSubStringLength(
          startOfFirstWord,
          numberOfCharacters
        );

        words.width = width;
        words.maximumHorizontalZoom = containerWidth / Math.ceil(width);
      });

      const height = textHeight * lines.length;

      lines.height = height;
      lines.maximumVerticalZoom = containerHeight / Math.ceil(height);
      lines.maximumHorizontalZoom = Math.min(
        ...lines.map(x => x.maximumHorizontalZoom)
      );
      lines.maximumZoom = Math.min(
        lines.maximumVerticalZoom,
        lines.maximumHorizontalZoom
      );
    });

    compositions.sort((a, b) => b.maximumZoom - a.maximumZoom);
    const best = compositions[0];

    this.setState({
      zoom: best.maximumZoom,
      textLines: best.map(words => {
        const startOfFirstWord = words[0][0];
        const endOfLastWord = words[words.length - 1][1];

        return this.props.text.substring(startOfFirstWord, endOfLastWord);
      }),
    });
  }

  render() {
    const { width, height, text, ...restProps } = this.props;
    console.log(this.state.zoom);
    console.log(this.state.textLines);
    return (
      <text
        {...restProps}
        ref={c => (this.textElement = c)}
        transform={`scale(${this.state.zoom}, ${this.state.zoom})`}
      >
        {this.state.textLines.map((line, i) =>
          <tspan key={i} x={0} dy="1em">
            {line}
          </tspan>
        )}
      </text>
    );
  }
}
