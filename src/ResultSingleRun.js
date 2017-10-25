import React from 'react';

class ResultSingleRun extends React.Component {
  render() {
    if (!this.props.stats || this.props.stats.length < 1) return null;

    return (
      <div style={this.props.style}>
       <p>Max Fitness: {this.props.stats[this.props.stats.length - 1].maximum}</p>
      </div>
    );
  }
}

export default ResultSingleRun;
