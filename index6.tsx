import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import * as $ from 'jquery';

class App extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = { selectedButton: null };
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(id) {
        console.log("Clicked! " + id);
        //this.state = { selectedButton: id };
        this.setState({ selectedButton: id });
    }

    render() {
        let style1 = {backgroundColor: "unset"};
        let style2 = {backgroundColor: "unset"};
        let style3 = {backgroundColor: "unset"};
        let click1 = _.partial(this.handleClick, "id1");
        let click2 = _.partial(this.handleClick, "id2");
        let click3 = _.partial(this.handleClick, "id3");

        switch (this.state.selectedButton) {
            case "id1":
                style1.backgroundColor = "red";
                break;
            case "id2":
                style2.backgroundColor = "red";
                break;
            case "id3":
                style3.backgroundColor = "red";
                break;
        }

        return (
            <div>
                <h1>Hello World</h1>
                <input id="id1" style={style1} type="button" value="A" 
                    onClick={click1}/>
                <input id="id2" style={style2} type="button" value="B" 
                    onClick={click2}/>
                <input id="id3" style={style3} type="button" value="C" 
                    onClick={click3}/>
            </div>
        );
    }
}

function main() {
    ReactDOM.render(
        <App />,
        document.getElementById("root")
    );
}
window.onload = main;