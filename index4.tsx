import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';

namespace ToggleButton {
    export interface Props {
        label: string;
        onClick?();
        toggledOn?: boolean;
    }

    export interface State {
        toggledOn: boolean;
    }
}
class ToggleButton extends React.Component<ToggleButton.Props, ToggleButton.State> {
    public constructor(props) {
        super(props);
        this.state = { toggledOn: false };
        this.handleClick = this.handleClick.bind(this);
    }

    public render(): JSX.Element {
        let style = this.props.toggledOn || this.state.toggledOn ? 
            { backgroundColor: "red" } : 
            { backgroundColor: "unset" };
        return (
            <input type="button"
                value={this.props.label} 
                onClick={this.handleClick} 
                style={style} />
        );
    }

    private handleClick() {
        if (this.props.onClick) this.props.onClick();
        else {
            this.setState((prevState, props) => {
                return { toggledOn: !prevState.toggledOn };
            });
        }
    }
}

namespace ToggleGroup {
    export interface Props {
        children: any;
    }

    export interface State {
        selectedButton: string;
    }
}
class ToggleGroup extends React.Component<ToggleGroup.Props, ToggleGroup.State> {
    public constructor(props) {
        super(props);
        this.state = { selectedButton: null };
    }

    private onSelected(button) {
        this.setState({ selectedButton: button.props.label });
    }

    private hookToggleButtons = (children: Array<any>) => {
        let hook = (child) => {
            return React.cloneElement(child, { 
                onClick: _.bind(this.onSelected, this, child),
                toggledOn: child.props.label == this.state.selectedButton,
            });
        }

        let result = [];
        for (let child of this.props.children) {
            let childOut = child.type == ToggleButton ? hook(child) : child;
            result.push(childOut);
        }
        return result;
    };

    public render(): JSX.Element {

        return (
            <div>
                {this.hookToggleButtons(this.props.children)}
            </div>
        );
    }
}

function main() {
    ReactDOM.render(
        <div>
            <ToggleButton label="O" />
            <ToggleGroup>
                <ToggleButton key="A" label="A" />
                <ToggleButton key="B" label="B" />
                <ToggleButton key="C" label="C" />
            </ToggleGroup>
            <ToggleGroup>
                <ToggleButton key="A" label="A" />
                <ToggleButton key="B" label="B" />
                <ToggleButton key="C" label="C" />
                <ToggleButton key="D" label="D" />
            </ToggleGroup>
        </div>,
        document.getElementById("app")
    );
}
window.onload = main;