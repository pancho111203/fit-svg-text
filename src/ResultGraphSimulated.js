import React from 'react';
import { LineChart } from 'react-d3-basic';

class ResultGraphSimulated extends React.Component {
  render() {
    if (!this.props.stats) return null;

    var width = 700,
      height = 300,
      margins = { left: 100, right: 100, top: 50, bottom: 50 },
      title = "Simulated Annealing Performance",
      // chart series,
      // field: is what field your data want to be selected
      // name: the name of the field that display in legend
      // color: what color is the line
      chartSeries = [
        {
          field: 'maximum',
          name: 'Maximum Fitness',
          color: '#00ff00'
        } 
      ],
      // your x accessor
      x = function (d) {
        return d.index;
      }
    return (
      <div style={this.props.style}>
        <LineChart
          margins={margins}
          title={title}
          data={this.props.stats}
          width={width}
          height={height}
          chartSeries={chartSeries}
          xLabel="Result Nr"
          yLabel="Fitness"
          x={x}
        />
        {this.props.stats.length > 0 ? <p>Max Fitness: {this.props.stats[this.props.stats.length - 1].maximum}</p> : null}
      </div>
    );
  }
}

export default ResultGraphSimulated;
