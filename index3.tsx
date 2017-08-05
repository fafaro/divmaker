import * as $ from 'jquery';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { SketchPicker, ColorResult } from 'react-color';
import { Style } from 'style-it';
import { css } from 'glamor';

namespace core {
    export interface ILiteEvent<T> {
        on(handler: { (data?: T): void }) : void;
        off(handler: { (data?: T): void }) : void;
    }

    export class LiteEvent<T> implements ILiteEvent<T> {
        private handlers: { (data?: T): void; }[] = [];

        public on(handler: { (data?: T): void }) : void {
            this.handlers.push(handler);
        }

        public off(handler: { (data?: T): void }) : void {
            this.handlers = this.handlers.filter(h => h !== handler);
        }

        public trigger(data?: T) {
            this.handlers.slice(0).forEach(h => h(data));
        }

        public expose() : ILiteEvent<T> {
            return this;
        }
    }
}

namespace ui {
    namespace ToggleButton {
        export interface Props { 
            className: string; 
            label: string;
            onChanged?(value: boolean): void; 
        }
        export interface State {
            toggled: boolean;
        }
    }
    class ToggleButton extends React.Component<ToggleButton.Props, ToggleButton.State> {
        public constructor() {
            super();
            this.state = { toggled: false };
        }

        public componentDidMount() {
            this.Changed.on(this.props.onChanged);
        }

        public render(): JSX.Element {
            const s = css({
                backgroundColor: this.state.toggled ? "#ffa" : "initial",
                borderRadius: "5px",
            });
            return (
                <input className={`${this.props.className} ${s}`}
                    value={this.props.label} 
                    type="button" 
                    onClick={this.toggle.bind(this)}>
                </input>
            );
        }

        private eventChanged = new core.LiteEvent<boolean>();
        public get Changed(): core.ILiteEvent<boolean> { return this.eventChanged; }

        public toggle() {
            this.setState((prevState, props) => { 
                let newState = { toggled: !prevState.toggled }; 
                this.eventChanged.trigger(newState.toggled);
                return newState;
            });
        }

        public get toggled() { return this.state.toggled; }
        public set toggled(val: boolean) {
            if (val == this.state.toggled) return;
            this.setState((prevState, props) => { 
                let newState = { toggled: val }; 
                this.eventChanged.trigger(newState.toggled);
                return newState;
            });
        }
    }

    class ToggleGroup extends React.Component<any, any> {
        public constructor() {
            super();
        }

        public componentDidMount() {
            const toggleSet = (button: ToggleButton, value: boolean) => {
                if (value) {
                    for (let button2 of this.props.children as Array<ToggleButton>) {
                        if (button2 == button) continue;
                        button2.toggled = false;
                    }
                }
            };
            for (let button of this.props.children as Array<ToggleButton>) {
                let oldChanged = button.props.onChanged;
                button.Changed.on(_.partial(toggleSet, button));
            }
        }

        public render(): JSX.Element {
            return <div>{this.props.children}</div>;
        }
    }

    export class App extends React.Component<any, any> {
        public tool1 = { name: "abc" };
        public tool2 = { name: "abc" };
        public state = {
            tool: this.tool1,
        };

        private styles = {
            main: css({
                display: "flex",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }),
            panel: css({
                fontFamily: "tahoma",
                fontSize: "10pt",
                display: "inline-block",
                backgroundColor: "lightgray",
                borderStyle: "outset",
                borderWidth: "2px",
                padding: "2px",
                overflowY: "auto",
            }),
            leftPanel: css({
                width: "105px",
                top: 0,
                bottom: 0,
            }),
            rightPanel: css({
                width: "180px",
                top: 0,
                bottom: 0,
            }),
            panelTitle: css({
                fontWeight: "bold",
                backgroundColor: "darkgray",
                color: "#222",
                padding: "2px",
                marginBottom: "3px",
            }),
            stageView: css({
                //borderStyle: "inset",
                //borderWidth: "2px",
                border: "1px solid black",
                display: "inline-block",
                flex: 1,
                overflow: "auto",                    
            }),
            stage: css({
                display: "inline-block",
                position: "relative",
                border: "1px solid black",
                margin: "10px",
                width: "1024px",
                height: "1024px",
                overflow: "hidden",
            }),
            panelButton: css({
                display: "inline-block",
                //backgroundColor: "lightgray",
                //borderStyle: "outset",
                //borderWidth: "2px",
                padding: "2px",
                width: "20px",
                height: "20px",
                margin: "1px",
            }),
            property: css({
                //fontWeight: "bold",
                backgroundColor: "#aaa",
                padding: "2px",
                marginBottom: "2px",
            })
        };

        public render(): JSX.Element {
            const s = this.styles;

            return (
                <div {...s.main}>
                    <div {...s.panel} {...s.leftPanel}>
                        <div {...s.panelTitle}>Toolbox</div>
                        <ToggleGroup>
                            <ToggleButton className={s.panelButton.toString()} label="C" />
                            <ToggleButton className={s.panelButton.toString()} label="Q" />
                        </ToggleGroup>
                    </div>
                    <div id="stageView" {...s.stageView}>
                        <div id="stage" {...s.stage}></div>
                    </div>
                    <div {...s.panel} {...s.rightPanel}>
                        <div {...s.panelTitle}>Properties</div>
                        <div {...s.property}>&bull; background-color</div>
                        {/*<SketchPicker width="160px" color={ this.appGlobal.currentColor } onChange={onColorChange}/>*/}
                    </div>
                </div>
            );            
        }
    }
}

function main() {
    ReactDOM.render(<ui.App />, document.getElementById("app"));
}
window.onload = main;