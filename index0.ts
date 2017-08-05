import * as $ from 'jquery';

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

function createBox(x: number, y: number): Element {
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
        "background-color": colors[nextColor]
    });
    nextColor = (nextColor + 1) % colors.length;
    document.body.appendChild(elem);
    return elem;
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

    public constructor() {
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
            document.body.appendChild(this.cursorElems[i]);
    }

    // @implements
    public unload() {
        for (let i = 0; i < 2; i++)
            this.cursorElems[i].parentElement.removeChild(this.cursorElems[i]);
    }

    // @implements
    public mouseDown(evt) { 
        if (evt.button == 0 && this.state == this.cls.STATE_READY) {
            evt.preventDefault(); 
            let coords = discretizeCoords([evt.pageX, evt.pageY]);
            this.state = this.cls.STATE_DRAGGING;
            this.elem = createBox(coords[0], coords[1]);
            this.dragStart = coords;
            this.dragCount = 0;
        }
    }

    // @implements
    public mouseUp(evt) { 
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
        this.moveCursor(evt.pageX, evt.pageY); 
        if (this.state == this.cls.STATE_DRAGGING) { 
            let coords = discretizeCoords([evt.pageX, evt.pageY]);
            $(this.elem).css({ 
                "width": `${coords[0] - this.dragStart[0]}px`, 
                "height": `${coords[1] - this.dragStart[1]}px` 
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
    private cls = SelectAndMoveController;
    private hilite = new this.cls.HighlightManager();
    private selectedElem: Element = null;
    private moveCtx = { 
        enabled: false,
        startPoint: [0, 0],
        elemOrigin: [0, 0]
    };

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
        createBox: new CreateBoxController(),
        selectAndMove: new SelectAndMoveController()
    };
    private tool: IToolController = null;

    public constructor() {
        this.setTool(this.toolbox.createBox);
    }

    public hook(target: EventTarget) {
        target.addEventListener("mousedown", this.mouseDown.bind(this));
        target.addEventListener("mouseup", this.mouseUp.bind(this));
        target.addEventListener("mousemove", this.mouseMove.bind(this));
    }

    public setTool(tool: IToolController) {
        if (this.tool) this.tool.unload();
        this.tool = tool
        this.tool.load();
    }

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

function main() {
    let c8r = new RouterController();
    c8r.hook(document);



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
            c8r.setTool(c8r.toolbox.selectAndMove);
        }
        else if (e.key == 'c') {
            c8r.setTool(c8r.toolbox.createBox);
        }
    });
}

window.onload = main;