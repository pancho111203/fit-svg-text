import React, { Component } from 'react';
import FitSVGTextRect from './FitSVGTextRect';
import FitText from './FitText';


// TODO y si hago presentacion directamente en browser con keybindings que van mostrando nuevas pantallas (dejar lo ultimo)
class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      text: 'Hello how are you im good',
      width: 200,
      height: 300
    }
  }
  render() {
    return (
      <div>
        <FitText algorithm="simulated" showResultGraph width={400} height={500} text={'Lorem Ipsum is simply dummy'} />
        <FitText algorithm="genetic" showResultGraph width={400} height={500} text={'Lorem Ipsum is simply dummy'} />
        <FitText algorithm="simulated" showResultGraph width={150} height={500} text={'Lorem Ipsum is just dummy text of the print and type world'} />
        <FitText algorithm="genetic" showResultGraph width={150} height={500} text={'Lorem Ipsum is just dummy text of the print and type world'} />
        <FitText algorithm="simulated" showResultGraph width={200} height={300} text={"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem"} />
        <FitText algorithm="genetic" showResultGraph width={200} height={300} text={"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem"} />
        Text<input value={this.state.text} onChange={(e)=>{this.setState({text: e.target.value})}} />
        Width<input onChange={(e)=>{this.setState({width: e.target.value})}} />
        Height<input onChange={(e)=>{this.setState({height: e.target.value})}} />
        <button onClick={() => {this.setState({ text: '' })}}>Reset</button>
        <FitText algorithm="simulated" width={this.state.width} height={this.state.height} text={this.state.text} />
        <FitText algorithm="genetic" width={this.state.width} height={this.state.height} text={this.state.text} />
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