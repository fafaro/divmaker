import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {IEvent, Event} from 'typescript.events';
import {Identity} from '../common/identity';
import * as mouse from '../common/mouse';

type JE = JSX.Element;

export class Rectangle extends Identity {
    left: number;
    top: number;
    width: number;
    height: number;

    public constructor(left: number, top: number, width: number, height: number) {
        super();
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}

function setCSSRect(style: object, rect: Rectangle): object {
    return Object.assign({}, style, {
        left: rect.left + "px", 
        top: rect.top + "px", 
        width: rect.width + "px", 
        height: rect.height + "px", 
    });
}

export class StageModel extends Event {
    private _rects: Rectangle[] = [];

    public get rects(): Rectangle[] { return this._rects; }

    public addRect(rect: Rectangle) {
        this._rects.push(rect);
        this.update();
    }

    public update() {
        this.emit("changed");
    }
}

namespace Stage {
    export interface Props {
        model: StageModel;
    }
}

export class Stage extends React.Component<Stage.Props, any> {
    private root: HTMLDivElement;
    private mouseOverlay: HTMLDivElement;
    private model: StageModel;
    //private esource: mouse.EventSource = null;

    public constructor(props: Stage.Props) {
        super(props);
        this.model = this.props.model;
        this.model.on("changed", () => { this.forceUpdate(); });
    }

    public componentDidMount() {
        // this.root.addEventListener("click", (evt) => { 
        //     let clientRect = this.root.getBoundingClientRect();
        //     let mousePos = {x: evt.clientX, y: evt.clientY};
        //     this.model.addRect(new Rectangle(
        //         mousePos.x - clientRect.left, 
        //         mousePos.y - clientRect.top,
        //         100, 100));
        // });

        //this.esource = new mouse.Mouse();
        //this.esource.subscribe(new mouse.Pipe([new mouse.Drag, new mouse.Log]));

        let m = mouse;

        let discretize = (grid: number): mouse.EventFunc => {
            return ((evt) => {
                if ('x' in evt) evt['x'] = Math.round(evt['x'] / grid) * grid;
                if ('y' in evt) evt['y'] = Math.round(evt['y'] / grid) * grid;
                return [evt];
            }) as mouse.EventFunc;
        }

        let divCreate = () => {
            let rect: Rectangle = null;
            return ((evt) => {
                switch (evt.name) {
                    case 'dragStart':
                        rect = new Rectangle(evt['startX'], evt['startY'], 
                            evt['endX'] - evt['startX'], evt['endY'] - evt['startY']); 
                        this.model.addRect(rect);
                        // fall through
                    case 'dragEnd': 
                    case 'dragging':
                        rect.left = Math.min(evt['startX'], evt['endX']);
                        rect.top = Math.min(evt['startY'], evt['endY']);
                        rect.width = Math.abs(evt['startX'] - evt['endX']);
                        rect.height = Math.abs(evt['startY'] - evt['endY']);
                        this.model.update();
                }
                return [evt];
            }) as mouse.EventFunc;
        };

        //let {left: ox, top: oy} = this.root.getBoundingClientRect();
        //let f = m.pipe(m.translate(-ox+ox, -oy+oy), m.drag(0), divCreate(), m.log);
        let f = m.pipe(discretize(10), m.drag(0), divCreate());

        let fglue = (evt: MouseEvent) => {
            f(m.convert(evt));
        };

        for (let e of ["mousemove", "mouseup", "mousedown"])
            this.root.addEventListener(e, fglue);
    }

    public componentWillUnmount() {
    }

    public render(): JE {
        let outerStyle = {
            border: "1px solid gray", 
            display: "inline-block" as "inline-block",  
            position: "relative" as "relative", 
            width: "1024px", 
            height: "1024px",
        };

        let rectStyle = {
            position: "absolute",
            border: "1px solid black", 
            backgroundColor: "green",
            pointerEvents: "none",
        };

        /*let mouseOverlayStyle = {
            position: "absolute" as "absolute", 
            width: "1024px", 
            height: "1024px",
            zIndex: 100,
        };*/

        return (
            <div style={outerStyle} ref={(ref) => { this.root = ref; }}>
                {/*<div style={mouseOverlayStyle} ref={(ref) => { this.mouseOverlay = ref; }} />*/}
                {this.model.rects.map((rect) => {
                    let style = setCSSRect(rectStyle, rect);
                    return <div key={rect.id} style={style} />
                })}
            </div>    
        );
    }
}