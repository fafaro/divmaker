namespace mouse {
    // class Event {
    //     name: string = "";
    //     args: object = {};
    // }

    // interface IEventProcessor {
    //     processEvent(evt: Event): Event[];
    // }

    // export class EventSource {
    //     public subscribe(p: IEventProcessor) {

    //     }
    // }

    // export class Mouse {

    // }

    // export class Drag implements IEventProcessor {
    //     processEvent(evt: Event): Event[] {
    //         return [];
    //     }
    // }

    // export class Log implements IEventProcessor {
    //     processEvent(evt: Event): Event[] {
    //         console.log(evt);
    //         return [evt];
    //     }
    // }

    // export class Pipe implements IEventProcessor {
    //     processEvent(evt: Event): Event[] {
    //         throw new Error("Method not implemented.");
    //     }
    // }

    export interface Event {
        name: string;
        [prop: string]: any;
    }

    export interface EventFunc {
        (evt: Event): Event[];
    }

    export function drag(button: number): EventFunc {
        let dragging = false;
        let startPos = {x: 0, y: 0};
        return (evt: Event): Event[] => {
            let result: Event[] = [];

            let onDragStart = (x: number, y: number) => {
                startPos.x = x; startPos.y = y;
                result.push({name: "dragStart", 
                    startX: startPos.x, 
                    startY: startPos.y,
                    endX: startPos.x, 
                    endY: startPos.y});
            };
            let onDragEnd = (x: number, y: number) => {
                result.push({name: "dragEnd",
                    startX: startPos.x, 
                    startY: startPos.y,
                    endX: x, endY: y});
            };
            let onDragging = (x: number, y: number) => {
                result.push({name: "dragging",
                    startX: startPos.x, 
                    startY: startPos.y,
                    endX: x, endY: y});
            };

            switch (evt.name) {
                case "mouseDown":
                    if (evt['button'] == button) {
                        if (dragging) onDragEnd(evt['x'], evt['y']);
                        dragging = true;
                        onDragStart(evt['x'], evt['y']);
                    }
                    break;
                case "mouseUp":
                    if (evt['button'] == button && dragging) {
                        dragging = false;
                        onDragEnd(evt['x'], evt['y']);
                    }
                    break;
                case "mouseMove":
                    if (dragging) {
                        onDragging(evt['x'], evt['y']);
                    }
                    break;
            }
            return result;
        };
    }

    export function log(evt: Event): Event[] {
        console.log(JSON.stringify(evt));
        return [evt];
    }

    export function translate(dx: number, dy: number): EventFunc {
        return (evt: Event): Event[] => {
            if ('x' in evt && 'y' in evt) {
                evt['x'] += dx;
                evt['y'] += dy;
            }
            return [evt];
        };
    }

    export function pipe(...funcs: EventFunc[]) {
        return (evt: Event): Event[] => {
            let buffer: Event[] = [evt];
            for (let func of funcs) {
                let newBuffer: Event[] = [];
                for (let evt2 of buffer) {
                    newBuffer.push(...func(evt2));
                }
                buffer = newBuffer;
            }
            return buffer;
        };
    }

    export function convert(evt: MouseEvent): Event {
        let arg = { name: "" };

        arg["x"] = evt.offsetX;
        arg["y"] = evt.offsetY;

        switch (evt.type) {
            case "mousemove":
                arg.name = "mouseMove";
                break;
            case "mouseup":
                arg.name = "mouseUp";
                arg["button"] = evt.button;
                break;
            case "mousedown":
                arg.name = "mouseDown";
                arg["button"] = evt.button;
                break;
            default:
                return;
        }

        return arg;
    }
}

export = mouse;