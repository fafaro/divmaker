import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import * as $ from 'jquery';

class Identity {
    private _id: number = 0;

    public constructor() {
        this._id = Identity.generateUniqueId();
    }

    public get id(): number { return this._id; }

    private static _uniqueId = 0;
    private static generateUniqueId(): number {
        return Identity._uniqueId++;
    }
}

class Div extends Identity {
    public top: number;
    public left: number;
    public width: number;
    public height: number;

    public constructor(top: number, left: number, width: number, height: number) {
        super();
        this.top = top;
        this.left = left;
        this.width = width;
        this.height = height;
    }
}

namespace Point {
    export function difference(a: Point, b: Point) {
        return {x: a.x - b.x, y: a.y - b.y};
    }

    export function minmax(a: Point, b: Point) {
        return [{x:Math.min(a.x, b.x), y:Math.min(a.y, b.y)},
            {x:Math.max(a.x, b.x), y:Math.max(a.y, b.y)}];
    }
}
interface Point {
    x: number;
    y: number;
}

namespace Controller {
    export class Msg {
        name: string = "";
        params: object = {};
        constructor(name: string, params: object = {}) {
            this.name = name;
            this.params = params;
        }
    }

    export interface Ctrlr {
        input(msg: Msg): Msg[];
    }


    export class Drag implements Ctrlr {
        private dragging: boolean = false;
        private button: number;
        private startPos: Point = {x: 0, y: 0};

        public constructor(button: number = 0) {
            this.button = button;
        }

        public input(msg: Msg): Msg[] {
            let output = [] as Msg[];
            
            function dragStart(startPos: Point, endPos: Point) {
                output.push(new Msg("dragStart", {startPos: startPos, endPos: endPos, delta: Point.difference(endPos, startPos)}));
            }

            function dragEnd(startPos: Point, endPos: Point) {
                output.push(new Msg("dragEnd", {startPos: startPos, endPos: endPos, delta: Point.difference(endPos, startPos)}));
            }

            function dragging(startPos: Point, endPos: Point) {
                output.push(new Msg("dragging", {startPos: startPos, endPos: endPos, delta: Point.difference(endPos, startPos)}));
            }

            switch (msg.name) {
                case "mouseDown":                 
                    if (!this.dragging && msg.params["button"] == this.button) { 
                        this.startPos = msg.params["pos"];
                        dragStart(this.startPos, msg.params["pos"]); 
                        this.dragging = true;
                    }
                    break;
                case "mouseUp": 
                    if (this.dragging && msg.params["button"] == this.button) {
                        dragEnd(this.startPos, msg.params["pos"]); 
                        this.dragging = false;
                    }
                    break;
                case "mouseMove":
                    if (this.dragging) {
                        dragging(this.startPos, msg.params["pos"]);
                    }
                    break;
            }
            return output;
        }
    }

    export class Print implements Ctrlr {
        input(msg: Msg): Msg[] {
            console.log(msg.name + " " + JSON.stringify(msg.params));
            return [msg];
        }
    }

    export class Pipe implements Ctrlr {
        private parts: Ctrlr[] = null;

        constructor(parts: Ctrlr[]) {
            this.parts = parts.slice();
        }

        input(msg: Msg): Msg[] {
            let output: Msg[] = [msg];
            for (let part of this.parts) {
                let newOutput: Msg[] = [];
                for (let m of output) {
                    newOutput = newOutput.concat(part.input(m));
                }
                output = newOutput;
            }
            return output;
        }
    }
}

namespace App {
    export interface Props {

    }
    export interface State {
        divs: Array<Div>;
    }
}
class App extends React.Component<App.Props, App.State> {
    public constructor(props: App.Props) {
        super(props);
        this.state = {
            divs: [new Div(0, 0, 100, 100)]
        };

        for (let m of ["onMouseDown", "onMouseUp","onMouseMove"])
            this[m] = this[m].bind(this);
    }

    private static DivCreate = class implements Controller.Ctrlr {
        private div: HTMLElement = null;

        private setPos(startPos: Point, endPos: Point) {
            let pos = Point.minmax(startPos, endPos);
            let a = pos[0];
            let b = pos[1];
            this.div.style.left = a.x + "px";
            this.div.style.top = a.y + "px";
            this.div.style.width = (b.x - a.x) + "px";
            this.div.style.height = (b.y - a.y) + "px";
        }

        input(msg: Controller.Msg): Controller.Msg[] {
            switch (msg.name) {
                case "dragStart":
                    this.div = document.createElement("div");
                    this.div.style.position = "absolute"; 
                    this.div.style.border = "1px solid black";
                    this.div.style.pointerEvents = "none";
                    this.setPos(msg.params["startPos"], msg.params["endPos"]);
                    document.body.appendChild(this.div);
                    break;
                case "dragEnd":
                    this.setPos(msg.params["startPos"], msg.params["endPos"]);
                    break;
                case "dragging":
                    this.setPos(msg.params["startPos"], msg.params["endPos"]);
                    break;
            }
            return [msg];
        }
    }

    private pipe = new Controller.Pipe([
        new Controller.Drag(0),
        //new Controller.Print,
        new App.DivCreate(),
        new Controller.Print,
    ]);

    private sendMsg(name: string, params: object = { }) {
        this.pipe.input(new Controller.Msg(name, params));
    }

    public onMouseDown(evt: React.MouseEvent<any>) {
        this.sendMsg("mouseDown", {pos: {x: evt.pageX, y: evt.pageY}, button:evt.button});
    }

    public onMouseUp(evt: React.MouseEvent<any>) {
        this.sendMsg("mouseUp", {pos: {x: evt.pageX, y: evt.pageY}, button:evt.button});
    }

    public onMouseMove(evt: React.MouseEvent<any>) {
        this.sendMsg("mouseMove", {pos:{x: evt.pageX, y: evt.pageY}});
    }

    public render(): JSX.Element {
        return (
            <div 
                style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0                
                }}
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                onMouseMove={this.onMouseMove}
            >
                {this.state.divs.map(function (divData) {
                    return <div 
                    key={divData.id}
                    style={{
                        position: "absolute",
                        border: "1px solid black", 
                        left: divData.left + "px", 
                        top: divData.top + "px",
                        width: divData.width + "px", 
                        height: divData.height + "px" }} />
                })}
            </div>
        );
    }
}

function main() {
    ReactDOM.render(<App />, document.getElementById("root"));
}

window.onload = main;