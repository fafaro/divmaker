import * as $ from 'jquery';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { SketchPicker, ColorResult } from 'react-color';
import { Style } from 'style-it';

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

namespace divmaker {
    class AppGlobal {
        public currentColor: string = "#fff";
        public selectedElem: Element = null;
    }

    function randInt(max) {
        return Math.floor(Math.random() * max);
    }

    var colors = [];
    var n = 10;
    for (let i = 0; i < n; i++) {
        let h = 360 * i / n;
        let s = 60;
        let l = 60;
        colors.push(`hsl(${h}, ${s}%, ${l}%)`);
    }
    var nextColor = 0;

    type Point = [number, number];
    var gridSize = 20;
    function discretizeCoords(p: Point): Point {
        let grid = gridSize;
        return [Math.round(p[0] / grid) * grid, Math.round(p[1] / grid) * grid];
    }
    function clientToStageCoords(p: Point): Point {
        let rect = document.getElementById("stage").getBoundingClientRect();
        return [p[0] - rect.left, p[1] - rect.top];
    }

    class UndoStack {
        private stack = [];

        public undo() {
            if (this.stack.length > 0) {
                let comm = this.stack.pop();
                comm();
            }
        }

        public push(comm: any) {
            this.stack.push(comm);
        }
    }

    let undoStack = new UndoStack();

    interface IToolController {
        load();
        unload();
        mouseDown(evt: MouseEvent);
        mouseUp(evt: MouseEvent);
        mouseMove(evt: MouseEvent);
    }

    class CreateBoxController implements IToolController {
        private readonly cls = CreateBoxController;
        private static readonly STATE_READY = 0;
        private static readonly STATE_DRAGGING = 1;
        private static readonly MINIMUM_DRAG_COUNT = 2;
        private state: number = CreateBoxController.STATE_READY;
        private elem: Element = null;
        private cursorElems: [Element, Element] = [null, null];
        private dragStart: Point = null;
        private dragCount: number = 0;
        private app: AppGlobal = null;

        public constructor(app: AppGlobal) {
            this.app = app;
            let makebox = () => {
                let elem = document.createElement("div");
                $(elem).css({
                    "display": "inline-block",
                    "position": "absolute",
                    "background-color": "red",
                    "z-index": 100
                });
                return elem;
            };
            for (let i = 0; i < 2; i++) {
                this.cursorElems[i] = makebox();
            }
        }

        // @implements
        public load() {
            for (let i = 0; i < 2; i++)
                document.getElementById("stage").appendChild(this.cursorElems[i]);
        }

        // @implements
        public unload() {
            for (let i = 0; i < 2; i++)
                this.cursorElems[i].parentElement.removeChild(this.cursorElems[i]);
        }

        // @implements
        public mouseDown(evt) {
            let mouseCoords = clientToStageCoords([evt.clientX, evt.clientY]); 
            if (evt.button == 0 && this.state == this.cls.STATE_READY) {
                evt.preventDefault(); 
                //evt.target.setCapture();
                let coords = discretizeCoords(mouseCoords);
                this.state = this.cls.STATE_DRAGGING;
                this.elem = this.createBox(coords[0], coords[1]);
                this.dragStart = coords;
                this.dragCount = 0;
                this.app.selectedElem = this.elem;
            }
        }

    
        private createBox(x: number, y: number): Element {
            let elem = document.createElement("div");
            $(elem).css({
                "border": "1px solid black",
                "box-sizing": "border-box",
                "display": "inline-block",
                //"width": "50px",
                //"height": "50px",
                "position": "absolute",
                "top" : y + "px",
                "left": x + "px",
                "background-color": this.app.currentColor//colors[nextColor]
            });
            nextColor = (nextColor + 1) % colors.length;
            document.getElementById("stage").appendChild(elem);
            return elem;
        }

        // @implements
        public mouseUp(evt) { 
            let mouseCoords = clientToStageCoords([evt.clientX, evt.clientY]); 
            if (evt.button == 0 && this.state == this.cls.STATE_DRAGGING) { 
                this.state = this.cls.STATE_READY;
                let theElem = this.elem;

                // keep only if sufficiently dragged
                if (this.dragCount < this.cls.MINIMUM_DRAG_COUNT) {
                    theElem.parentElement.removeChild(theElem);
                }
                else {
                    // let the box remain, and add to undo-stack.
                    undoStack.push(() => { theElem.parentElement.removeChild(theElem); });
                }

                // the controller releases the box from its control
                this.elem = null;
            }
        }

        private moveCursor(x: number, y: number) {
            let coords = discretizeCoords([x, y]);
            let thick = 1;
            let len = 10;
            $(this.cursorElems[0]).css({
                "top": coords[1] - len * 0.5,
                "left": coords[0] - thick * 0.5,
                "width": thick,
                "height": len
            });
            $(this.cursorElems[1]).css({
                "top": coords[1] - thick * 0.5,
                "left": coords[0] - len * 0.5,
                "width": len,
                "height": thick
            });
        }

        // @implements
        public mouseMove(evt) {
            let mouseCoords = clientToStageCoords([evt.clientX, evt.clientY]); 
            this.moveCursor(mouseCoords[0], mouseCoords[1]); 
            if (this.state == this.cls.STATE_DRAGGING) { 
                let coords = discretizeCoords(mouseCoords);
                let pa = coords;
                let pb = this.dragStart;
                let upperLeft = [Math.min(pa[0], pb[0]), Math.min(pa[1], pb[1])];
                let lowerRight = [Math.max(pa[0], pb[0]), Math.max(pa[1], pb[1])];
                $(this.elem).css({ 
                    top: `${upperLeft[1]}px`,
                    left: `${upperLeft[0]}px`,
                    width: `${lowerRight[0] - upperLeft[0]}px`, 
                    height: `${lowerRight[1] - upperLeft[1]}px` 
                });
                this.dragCount++;
            }
        }
    }

    class SelectAndMoveController implements IToolController {
        static HighlightManager = class {
            private elements: Array<{ elem: Element, css: object }> = [];
            private find(elem: Element): number {
                for (let i = 0; i < this.elements.length; i++)
                    if (this.elements[i].elem == elem)
                        return i;
                return -1;
            }

            public clear() {
                for (let entry of this.elements) {
                    $(entry.elem).css(entry.css);
                }
                this.elements = [];
            }

            public highlight(elem: Element) {
                if (this.find(elem) != -1) return; // if already found
                this.elements.push({ elem: elem, css: $(elem).css(["box-shadow"])});

                $(elem).css({
                    "box-shadow": "0 0 10px 3px rgba(0, 200, 255, 0.7)"
                });
            }
        };
        private app: AppGlobal = null;
        private cls = SelectAndMoveController;
        private hilite = new this.cls.HighlightManager();
        private selectedElem: Element = null;
        private moveCtx = { 
            enabled: false,
            startPoint: [0, 0],
            elemOrigin: [0, 0]
        };

        public constructor(app: AppGlobal) {
            this.app = app;
        }

        // @implements
        public load() {
            if (this.selectedElem) 
                this.hilite.highlight(this.selectedElem);
        }

        // @implements
        public unload() {
            this.hilite.clear();        
        }

        // @implements
        public mouseDown(evt: MouseEvent) {
            evt.preventDefault();

            // check if we are starting move on existing element
            if (this.selectedElem == evt.target) {
                console.log("Begin move!");
                this.moveCtx.enabled = true;
                this.moveCtx.startPoint = discretizeCoords([evt.pageX, evt.pageY]);
                let props = $(this.selectedElem).css(["left", "top"]);
                this.moveCtx.elemOrigin = [parseInt(props["left"]), parseInt(props["top"])];
            }
        }

        // @implements
        public mouseUp(evt: MouseEvent) {
            if (!this.moveCtx.enabled) {
                this.hilite.clear();
                this.hilite.highlight(evt.target as Element);
                this.selectedElem = evt.target as Element;
            }
            else
                this.moveCtx.enabled = false;
        }

        // @implements
        public mouseMove(evt: MouseEvent) {
            if (this.moveCtx.enabled) {
                let startPt = this.moveCtx.startPoint;
                let elemO = this.moveCtx.elemOrigin;
                let newPt = discretizeCoords([evt.pageX, evt.pageY]);
                this.cls.moveBoxTo(this.selectedElem, 
                    elemO[0] + newPt[0] - startPt[0], 
                    elemO[1] + newPt[1] - startPt[1]);
            }
        }

        private static moveBoxTo(elem: Element, x: number, y: number) {
            $(elem).css({ left: x, top: y});
        }
    }

    class RouterController {
        
        public toolbox = {
            createBox: null as CreateBoxController,
            selectAndMove: null as SelectAndMoveController
        };
        private tool: IToolController = null;
        private eventToolChanged = new core.LiteEvent<IToolController>();

        public constructor(app: AppGlobal) {
            this.toolbox.createBox = new CreateBoxController(app);
            this.toolbox.selectAndMove = new SelectAndMoveController(app);

            this.setTool(this.toolbox.createBox);
        }

        public hook(target: EventTarget) {
            target.addEventListener("mousedown", this.mouseDown.bind(this));
            target.addEventListener("mouseup", this.mouseUp.bind(this));
            target.addEventListener("mousemove", this.mouseMove.bind(this));
        }

        public setTool(tool: IToolController) {
            if (tool == this.tool) return;
            if (this.tool) this.tool.unload();
            this.tool = tool
            this.tool.load();
            this.eventToolChanged.trigger(this.tool);
        }

        public get ToolChanged() { return this.eventToolChanged; }

        public mouseDown(evt) {
            this.tool.mouseDown(evt);        
        }

        public mouseMove(evt) {
            this.tool.mouseMove(evt);        
        }

        public mouseUp(evt) {
            this.tool.mouseUp(evt);
        }
    }

    interface AppProps {

    }

    interface AppState {
        currentTool: IToolController;
    }

    export class App extends React.Component<AppProps, AppState> {
        private appGlobal = new AppGlobal();
        private routerCtlr = new RouterController(this.appGlobal);

        public constructor() {
            super();
            this.state = { currentTool: null };
            this.routerCtlr.ToolChanged.on((tool: IToolController) => { 
                this.setState({ currentTool: tool }); 
                console.log("Tool changed!");
            });
        }

        // @overrides
        componentDidMount(): void {
            let router = this.routerCtlr;
            router.hook(document.getElementById("stageView"));
            $(document).keydown(function (e) { 
                if (e.ctrlKey && e.key == 'z')
                    undoStack.undo();
                else if (e.key == '[') {
                    if (gridSize > 5) gridSize /= 2;
                }
                else if (e.key == ']') {
                    if (gridSize < 50) gridSize *= 2;
                }
                else if (e.key == 'q') {
                    router.setTool(router.toolbox.selectAndMove);
                }
                else if (e.key == 'c') {
                    router.setTool(router.toolbox.createBox);
                }
            });              
        }

        componentWillUnmount?(): void {
            // TODO
        }

        // @overrides
        render(): JSX.Element {
            const s = {
                main: {
                    display: "flex",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                },
                panel: {
                    fontFamily: "tahoma",
                    fontSize: "10pt",
                    display: "inline-block",
                    backgroundColor: "lightgray",
                    borderStyle: "outset",
                    borderWidth: "2px",
                    padding: "2px",
                    overflowY: "auto",
                },
                leftPanel: {
                    width: "105px",
                    top: 0,
                    bottom: 0,
                },
                rightPanel: {
                    width: "180px",
                    top: 0,
                    bottom: 0,
                },
                panelTitle: {
                    fontWeight: "bold",
                    backgroundColor: "darkgray",
                    color: "#222",
                    padding: "2px",
                    marginBottom: "3px",
                },
                stageView: {
                    //borderStyle: "inset",
                    //borderWidth: "2px",
                    border: "1px solid black",
                    display: "inline-block",
                    flex: 1,
                    overflow: "auto",                    
                },
                stage: {
                    display: "inline-block",
                    position: "relative",
                    border: "1px solid black",
                    margin: "10px",
                    width: "1024px",
                    height: "1024px",
                    overflow: "hidden",
                },
                panelButton: {
                    display: "inline-block",
                    //backgroundColor: "lightgray",
                    //borderStyle: "outset",
                    //borderWidth: "2px",
                    padding: "2px",
                    width: "20px",
                    height: "20px",
                    margin: "1px",
                },
                property: {
                    //fontWeight: "bold",
                    backgroundColor: "#aaa",
                    padding: "2px",
                    marginBottom: "2px",
                }
            };

            function cs(s: Object|Array<Object>): React.CSSProperties {
                if (!(s instanceof Array)) return s as React.CSSProperties;
                let result = {};
                for (let props of s) {
                    Object.assign(result, props);
                }
                return result as React.CSSProperties;
            }

            const onColorChange = (color: ColorResult) => {
                let app = this.appGlobal;
                let rgba = color.rgb;
                app.currentColor = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
                if (app.selectedElem) {
                    $(app.selectedElem).css("background-color", app.currentColor);
                }
            };
            
            return (
                <div style={cs(s.main)}>
                    <div style={cs([s.panel, s.leftPanel])}>
                        <div style={cs(s.panelTitle)}>Toolbox</div>
                        <input type="button" style={cs(s.panelButton)} value="C"></input>
                        <input type="button" style={cs(s.panelButton)} value="Q"></input>
                    </div>
                    <div id="stageView" style={cs(s.stageView)}>
                        <div id="stage" style={cs(s.stage)}></div>
                    </div>
                    <div style={cs([s.panel, s.rightPanel])}>
                        <div style={cs(s.panelTitle)}>Properties</div>
                        <div style={cs(s.property)}>&bull; background-color</div>
                        <SketchPicker width="160px" color={ this.appGlobal.currentColor } onChange={onColorChange}/>
                    </div>
                </div>
            );
        }
    }
}

function main() {
    ReactDOM.render(<divmaker.App />, document.getElementById("root"));
}

window.onload = main;