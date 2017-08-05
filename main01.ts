/**
 * A purely in-memory representation of the divmaker application.
 * Will be unit tested.
 */

import browser from './main01_browser';
import { Event as EventEmitter } from 'typescript.events';

export namespace divmaker {
    export class Identity {
        private static _uniqueId = 0;
        private _id = Identity._uniqueId++;
        public get id() { return this._id; }
    }

    export class Rectangle {
        left: number; top: number; width: number; height: number;

        constructor(left: number = 0, top: number = 0, 
            width: number = 0, height: number = 0) {
            this.left = left;
            this.top = top;
            this.width = width;
            this.height = height;
        }

        set(rect: Rectangle);
        set(left: number, top: number, width: number, height: number);
        set(leftOrRect: number | Rectangle, top?: number, width?: number, height?: number) {
            if (leftOrRect instanceof Rectangle) {
                let rect = leftOrRect as Rectangle;
                this.left = rect.left;
                this.top = rect.top;
                this.width = rect.width;
                this.height = rect.height;
            }
            else {
                this.left = leftOrRect as number;
                this.top = top;
                this.width = width;
                this.height = height;
            }
        }
    }

    export class Color {
        readonly r: number; // 0 - 255
        readonly g: number; // 0 - 255
        readonly b: number; // 0 - 255
        readonly a: number; // 0 - 1

        constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 1.0) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }

        //static parse(s: string): Color {
        //}

        toString(): string {
            function c(n: number) {
                return n.toFixed(0);
            }
            return `rgba(${c(this.r)}, ${c(this.g)}, ${c(this.b)}, ${this.a})`;
        }

        static readonly WHITE = new Color(255, 255, 255, 1.0);
        static readonly TRANSPARENT = new Color(0, 0, 0, 0);
    }

    export class Div extends Identity {
        private _rect = new Rectangle();
        private _borderWidth: number = 1;
        private _backgroundColor: Color = Color.TRANSPARENT;

        constructor(left: number, top: number, width: number, height: number) {
            super();
            this._rect.set(left, top, width, height);
        }

        get left() { return this._rect.left; }
        set left(val: number) { this._rect.left = val; }
        get top() { return this._rect.top; }
        set top(val: number) { this._rect.top = val; }
        get width() { return this._rect.width; }
        set width(val: number) { this._rect.width = val; }
        get height() { return this._rect.height; }
        set height(val: number) { this._rect.height = val; }
        get rect() { return this._rect; }
        set rect(val: Rectangle) { 
            this._rect = new Rectangle(); 
            this._rect.set(val); 
        }

        get borderWidth() { return this._borderWidth; }
        set borderWidth(val: number) { this._borderWidth = val; }
        get backgroundColor(): Color { return this._backgroundColor; }
        set backgroundColor(val: Color) { this._backgroundColor = val; }

        borderRadius: number = 0;
        text: string = "";
        padding: number = 0;
    }

    export class Point {
        x: number = 0; 
        y: number = 0;
        constructor(x: number = 0, y: number = 0) {
            this.x = x;
            this.y = y;
        }
    }

    namespace geom {
        export function bounds(a: Point, b: Point): Rectangle {
            let upperLeft = new Point(Math.min(a.x, b.x), Math.min(a.y, b.y));
            let lowerRight = new Point(Math.max(a.x, b.x), Math.max(a.y, b.y));
            return new Rectangle(upperLeft.x, upperLeft.y, 
                lowerRight.x - upperLeft.x, lowerRight.y - upperLeft.y);
        }
    }

    export class App {
        constructor() {
            this._rects.addListener("change", () => {
                let actual = new Set(this._rects.toArray());
                this._selection = this._selection.filter(x => actual.has(x));
            });
        }

        public userInput(input: any) {
            function singleInput(input: any) {

                // Keyboard shortcuts
                if (input.name == 'keyPress') {
                    let kbs = App.KBShortcuts;
                    switch (input.key) {
                    case kbs.SelectTool:
                        this._tool = this._toolbox.Select;
                        break;
                    case kbs.CreateDivTool:
                        this._tool = this._toolbox.CreateDiv;
                        break;
                    case kbs.IncreaseGrid:
                        this.increaseGrid();
                        break;
                    case kbs.DecreaseGrid:
                        this.decreaseGrid();
                        break;
                    }
                }
                else if (input.name == 'keyDown') {
                    switch (input.key) {
                    case App.KBShortcuts.DeleteSelection:
                        this.deleteSelection();
                        break;
                    }
                }

                if (this._tool) {
                    this._tool.userInput(input);
                }
            }

            //console.log(input);
            if (input instanceof Array) 
                for (let m of input) singleInput.call(this, m);
            else 
                singleInput.call(this, input);
        }

        public get rects(): Div[] {
            return this._rects.toArray();
        }

        public createRect(left: number, top: number, 
            width: number, height: number): Div {
            let newRect = new Div(left, top, width, height);
            this._rects.push(newRect);
            return newRect;
        }

        public findRectAt(p: Point): Div {
            let fuzzyRadius = 5;
            for (let i = this._rects.length - 1; i >= 0; i--) {
                let rect = this._rects.get(i);
                if (p.x >= rect.left - fuzzyRadius && 
                    p.y >= rect.top - fuzzyRadius && 
                    p.x < rect.left + rect.width + fuzzyRadius &&
                    p.y < rect.top + rect.height + fuzzyRadius)
                    return rect;
            }
            return null;
        }

        public deleteRect(r: Div) {
            this._rects.remove(r);
        }

        public get selection(): Div[] {
            return this._selection;
        }

        public set selection(val: Div[]) {
            this._selection = val;
        }

        public isSelected(rect: Div): boolean {
            return this._selection.find((r) => r === rect) !== undefined;
        }

        public get tool() { return this._tool; }
        public get gridSize(): number { return this._gridSize; }
        public increaseGrid() { if (this._gridSize < 128) this._gridSize *= 2; }
        public decreaseGrid() { if (this._gridSize > 1) this._gridSize /= 2; }
        public deleteSelection() {
            this._rects.remove(this._selection);
        }

        // Private =============================================================
        private readonly _rects = new class extends EventEmitter {
            private _divs: Div[] = [];
            get(index: number) { return this._divs[index]; }
            get length(): number { return this._divs.length; }
            toArray(): Div[] { return this._divs.slice(); }
            push(div: Div) { this._divs.push(div); this.onChange(); }
            remove(div: Div);
            remove(divs: Div[]);
            remove(divs: Div|Div[]) {
                if (divs instanceof Div)
                    divs = [divs];
                let hash = {};
                divs.forEach((r) => { hash[r.id] = true; });
                this._divs = this._divs.filter((r) => !(r.id in hash));
                this.onChange();
            }
            private onChange() { this.emit("change"); }
        };
        private _toolbox = {
            CreateDiv: new App.CreateDivTool(this),
            Select: new App.SelectTool(this),
        };
        private _tool = this._toolbox.CreateDiv;
        private _selection: Div[] = [];
        private _gridSize: number = 16;
    }

    export namespace App {
        function discretize(gridSize: number, input: any): any {
            input = Object.assign({}, input);
            let grid = gridSize;

            let d = (n) => {
                return Math.round(n / grid) * grid;
            };

            if ('x' in input) input['x'] = d(input['x']);
            if ('y' in input) input['y'] = d(input['y']);

            return input;
        }        

        export namespace KBShortcuts {
            export const SelectTool = 'q';
            export const CreateDivTool = 'c';
            export const IncreaseGrid = ']';
            export const DecreaseGrid = '[';
            export const DeleteSelection = 'Delete';
        }

        export class CreateDivTool {
            private _app: App = null;
            private _mouseState = { 
                dragging: false,
                startPos: new Point(),
            };            
            private _currRect: Div = null;

            constructor(app: App) {
                this._app = app;
            }

            get name() { return 'Create'; }

            userInput(input: any) {
                input = discretize(this._app.gridSize, input);
                switch (input.name) {
                case "mouseDown":
                    if (input.button == 0) {
                        let startPos = new Point(input.x, input.y);
                        this._mouseState.dragging = true;
                        this._mouseState.startPos = startPos;
                        this._currRect = 
                            this._app.createRect(startPos.x, startPos.y, 0, 0);
                    }
                    break;
                case "mouseMove":
                    if (this._mouseState.dragging) {
                        let currRect = this._currRect;
                        let brect = geom.bounds(this._mouseState.startPos, 
                            new Point(input.x, input.y));
                        currRect.rect = brect;
                    }
                    break;
                case "mouseUp":
                    if (this._mouseState.dragging && input.button == 0) {
                        this._mouseState.dragging = false;
                        let currRect = this._currRect;
                        let brect = geom.bounds(this._mouseState.startPos, 
                            new Point(input.x, input.y));
                        currRect.rect = brect;

                        // We must decide here if we wish to delete
                        // the rectangle. We want to do this when
                        // the click was a typo -- too small,
                        // and too few mouseMove events.
                        if (brect.width < this._app.gridSize &&
                            brect.height < this._app.gridSize) {
                            this._app.deleteRect(currRect);
                            // TODO: add check for few mouseMove events
                        }

                        this._currRect = null;
                    }
                    break;
                case 'keyPress':
                    break;
                }
            }
        }

        export class SelectTool {
            private _app: App = null;
            constructor(app: App) {
                this._app = app;
            }

            get name() { return 'Select'; }

            userInput(input: any) {
                switch (input.name) {
                case "mouseClick":
                    let p = new Point(input.x, input.y);
                    let rectUnder = this._app.findRectAt(p);
                    if (input.ctrlKey) {
                        if (rectUnder !== null) {
                            let alreadySelected = this._app.selection.find(
                                (r) => r === rectUnder) !== undefined;
                            if (alreadySelected) { // remove from selection
                                this._app.selection = this._app.selection.filter(
                                    (r) => r !== rectUnder);
                            }
                            else {
                                // TODO: Probably best not to directly
                                // modify a property
                                this._app.selection.push(rectUnder); 
                            }
                        }
                    }
                    else
                        this._app.selection = (rectUnder !== null ? [rectUnder] : []);
                    break;
                }
            }
        }
    }  
}

namespace Tests {
    export function main() {
        console.log("Beginning tests ...");
        testCreateDiv();
        testSelectDiv();
        testPropsWindow();
        console.log("Test passed!");
    }

    function assert(cond: boolean, msg?: string) {
        if (!cond) throw `Test failed: ${msg}`;
    }

    function testCreateDiv() {
        {
            console.log("When mouse clicks, drags and releases with left " + 
                "mouse button, a rectangle gets created.");
            let app = new divmaker.App();
            assert(app.rects.length == 0);
            app.userInput([
                { name: "mouseMove", x: 50, y: 50 },
                { name: "mouseDown", x: 32, y: 32, button: 0 },
                { name: "mouseMove", x: 128, y: 64 },
                { name: "mouseUp", x: 128, y: 64, button: 0 },
                { name: "mouseMove", x: 50, y: 50 },
            ]);
            assert(app.rects.length == 1, "Rectangle not created!");
            let rect = app.rects[0];
            assert(rect !== undefined);
            assert(rect.left == 32);
            assert(rect.top == 32);
            assert(rect.width == 96);
            assert(rect.height == 32);
        }

        {
            console.log("A rectangle should not be created by dragging other " + 
                "mouse buttons.");
            let app = new divmaker.App();
            assert(app.rects.length == 0);
            app.userInput([
                { name: "mouseDown", x: 100, y: 100, button: 1 },
                { name: "mouseMove", x: 200, y: 150 },
                { name: "mouseUp", x: 200, y: 150, button: 1 },
            ]);
            assert(app.rects.length == 0, "Rectangle should not be created!");
        }

        {
            console.log("A click should not create a rectangle.");
            let app = new divmaker.App();
            app.userInput([
                { name: 'mouseDown', x: 100, y: 100, button: 0 },
                { name: 'mouseUp', x: 100, y: 100, button: 0 },
            ]);
            assert(app.rects.length == 0);
        }
    }

    function testSelectDiv() {
        {
            console.log("User selects selection tool by pressing Q" +
                " and points and clicks anywhere on the surface of" +
                " a rectangle.");
            let app = new divmaker.App();

            // create three overlapping rectangles 
            let rect1 = app.createRect(60, 60, 80, 80);
            let rect2 = app.createRect(90, 90, 80, 80);
            let rect3 = app.createRect(30, 110, 90, 80);

            assert(app.selection.length == 0);

            //select selection tool
            app.userInput({
                name: 'keyPress', 
                key: divmaker.App.KBShortcuts.SelectTool}); 

            // click on second rectangle
            app.userInput({name: 'mouseClick', x: 90, y: 90, button: 0});
            assert(app.selection.length == 1);
            assert(app.selection[0] == rect2);

            // click on third rectangle
            app.userInput({name: 'mouseClick', x: 119, y: 110, button: 0});
            assert(app.selection.length == 1);
            assert(app.selection[0] == rect3);

            // clear selection
            app.userInput({name: 'mouseClick', x: 300, y: 110, button: 0});
            assert(app.selection.length == 0);
        }
    }

    function testPropsWindow() {
        let app = new divmaker.App();
        let rect = app.createRect(10, 10, 100, 100);
        //rect.borderWidth = 10;
        //assert(rect.borderWidth == 10);

        // show props window for rect with userInput
        // apply userInput on PropsWindow to change borderWidth
        // check if borderWidth has changed on rect
    }
}

export function main() {
    Tests.main();
    browser.test();
    browser.run(new divmaker.App());
}