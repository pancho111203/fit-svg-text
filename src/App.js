import React, { Component } from 'react';
import _ from 'ramda';
import FitSVGTextRect from './FitSVGTextRect';
import FitText from './FitText';
import ResultsGatherer from './ResultsGatherer';


// TODO y si hago presentacion directamente en browser con keybindings que van mostrando nuevas pantallas (dejar lo ultimo)
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: 'Hello how are you im good',
      width: 200,
      height: 300,
      finished: false,
      meanConfigs: [],
      showingN: 1
    }

    this.resultsGatherer = new ResultsGatherer();
    this.resultsGatherer.addStoreListener((results) => {

      const configs = results.map((result) => { return result.bestConfig; });
      const confLen = configs[0].length;
      const meanConfigs = [];
      for (let i = 0; i < confLen; i++) {
        const mergeConfigs = configs.map((conf) => { return conf[i]; });
        const avg = _.mean(mergeConfigs);
        meanConfigs.push(avg);
      }
      console.log(meanConfigs);
      this.setState({
        finished: true,
        meanConfigs
      });
    });
  }

  render() {
    const elements = [
      // TODO change first 
      (<FitText algorithm="simulated" showResultGraph width={400} height={500} text={`Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32 The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by Rakham`} resultsGatherer={this.resultsGatherer} />),
      (<FitText algorithm="genetic" showResultGraph width={400} height={500} text={`Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32 The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by Rakham`} resultsGatherer={this.resultsGatherer} />),
      (<FitText algorithm="simulated" showResultGraph width={150} height={500} text={'Lorem Ipsum is just dummy text of the print and type world'} resultsGatherer={this.resultsGatherer} />),
      (<FitText algorithm="genetic" showResultGraph width={150} height={500} text={'Lorem Ipsum is just dummy text of the print and type world'} resultsGatherer={this.resultsGatherer} />),
      (<FitText algorithm="simulated" showResultGraph width={200} height={300} text={"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem"} resultsGatherer={this.resultsGatherer} />),
      (<FitText algorithm="genetic" showResultGraph width={200} height={300} text={"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem"} resultsGatherer={this.resultsGatherer} />),
      (<div>
        Text<input value={this.state.text} onChange={(e) => { this.setState({ text: e.target.value }) }} />
        Width<input onChange={(e) => { this.setState({ width: e.target.value }) }} />
        Height<input onChange={(e) => { this.setState({ height: e.target.value }) }} />
        <button onClick={() => { this.setState({ text: '' }) }}>Reset</button>
        <FitText algorithm="simulated" width={this.state.width} height={this.state.height} text={this.state.text} />
        <FitText algorithm="genetic" width={this.state.width} height={this.state.height} text={this.state.text} />
      </div>),
      (
        <div>
          {!this.state.finished ? null : (
            <div>
              <p>Usando configuracion media de resultados anteriores:</p>
              <FitText config={this.state.meanConfigs} algorithm="singlerun" showResultGraph width={400} height={500} text={'Lorem Ipsum is simply dummy'} resultsGatherer={this.resultsGatherer} />
              <FitText config={this.state.meanConfigs} algorithm="singlerun" showResultGraph width={150} height={500} text={'Lorem Ipsum is just dummy text of the print and type world'} resultsGatherer={this.resultsGatherer} />
              <FitText config={this.state.meanConfigs} algorithm="singlerun" showResultGraph width={200} height={300} text={"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem"} resultsGatherer={this.resultsGatherer} />
            </div>
          )}
        </div>
      )
    ];

    const elementsToShow = _.take(this.state.showingN, elements);

    return (
      <div>
        {elementsToShow}
        <button style={{ width: '100%', height: 50 }} onClick={() => { this.setState({ showingN: this.state.showingN + 1 }) }}>Muéstrame más</button>
      </div>
    )
  }
}

export default App;

{/* <FitSVGTextRect width="200" height="150" text="Some text here" />
<FitSVGTextRect width="200" height="100" text="Some text here" />        
<FitSVGTextRect width="200" height="60" text="Some text here" />        
<FitSVGTextRect width="200" height="100" text="Some text here" />        
<FitSVGTextRect width="20" height="10" text="Some text here" />                
<FitSVGTextRect width="100" height="100" text="It starts failing if you put a lot of text tdfsdfsdfsdfsdfsdfsdfsdfsdfough" />                
<FitSVGTextRect width="150" height="100" text="It starts failing if you put a lot of text though" />                
<FitSVGTextRect width="150" height="100" text="Single" />         */}