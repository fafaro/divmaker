import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import * as $ from 'jquery';

function ToggleButton(props: { toggled: boolean, label: string, onClick?: ()=>void }): JSX.Element {
    if (props.toggled)
        return <input 
            type="button" style={{backgroundColor: "red"}} 
            value={props.label} onClick={props.onClick} />
    else
        return <input 
            type="button" style={{backgroundColor: "unset"}} 
            value={props.label} onClick={props.onClick} />
}

namespace App {
    export interface Props {

    }
    export interface State {
        choice: string;
        choice2: boolean;
    }
}
class App extends React.Component<App.Props, App.State> {
    public constructor(props: App.Props) {
        super(props);
        this.state = {
            choice: "A",
            choice2: false,
        };
    }

    public render(): JSX.Element {
        const select = (x: string) => {
            return () => {
                this.setState({choice: x});
            }
        };
        const toggle2 = (prevState: {choice2:false}): any => ({ choice2: !prevState.choice2 });
        return (
            <div>
                <h1>App</h1>
                <ToggleButton toggled={this.state.choice2} label="O" onClick={() => this.setState(toggle2)} /><br />
                <ToggleButton toggled={this.state.choice == 'A'} label="A" onClick={select("A")}/>
                <ToggleButton toggled={this.state.choice == 'B'} label="B" onClick={select("B")}/>
                <ToggleButton toggled={this.state.choice == 'C'} label="C" onClick={select("C")}/>
            </div>
        );
    }
}

function main() {
    ReactDOM.render(<App/>, document.getElementById("root"));
}

window.onload = main;