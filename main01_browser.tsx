import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as $ from 'jquery';
import * as _ from 'lodash';
import { divmaker } from './main01';

namespace browser {
    let FPS = 24;
    var root: HTMLDivElement = null;
    export var app: divmaker.App = null;

    export function run(app: divmaker.App) {
        browser.app = app;
        window['app'] = app;
        root = document.createElement('div');
        Object.assign(root.style, {
            position: 'absolute',
            left: 0, top: 0, right: 0, bottom: 0,
        });

        renderHeaderCss();

        function getX(e: any) {
            return e.pageX;
        }
        function getY(e: any) {
            return e.pageY;
        }

        window.addEventListener('mousemove', (evt) => {
            app.userInput({name: 'mouseMove', x: getX(evt), y: getY(evt)});
        });
        window.addEventListener('mouseup', (evt) => {
            app.userInput({name: 'mouseUp', x: getX(evt), y: getY(evt), 
                button: evt.button});
        });
        window.addEventListener('mousedown', (evt) => {
            app.userInput({name: 'mouseDown', x: getX(evt), y: getY(evt),
                button: evt.button});
        });
        window.addEventListener('click', (evt) => {
            app.userInput({name: 'mouseClick', x: getX(evt), y: getY(evt),
                button: evt.button,
                ctrlKey: evt.ctrlKey});
        });
        window.addEventListener('keypress', (evt) => {
            app.userInput({name: 'keyPress', key: evt.key});
        });
        window.addEventListener('keydown', (evt) => {
            app.userInput({name: 'keyDown', key: evt.key});
        });
        document.body.appendChild(root);
        window.setInterval(render, 1000 / FPS);
    }

    export function test() {
        console.log("testing testing 1...2...3...");
    }

    function renderHeaderCss() {
        $('head > style').text(`
            * {
                font-size: 10pt;
                font-family: tahoma;                
                -webkit-user-drag: none;
                -webkit-user-select: none;
                user-select: none;
            }

            .fixedWidth {
                display: inline-block;
                width: 70px;
            }
        `);
    }

    function render() {
        ReactDOM.render((
            <div>
                <GridUnderlay size={app.gridSize}/>
                <div style={{position: 'fixed', padding: 10, zIndex: 10, left:10, top:10}}>
                    <div>
                        <span className="fixedWidth">Num rects</span>:&nbsp;
                        {app.rects.length}
                    </div>
                    <div>
                        <span className="fixedWidth">Selection</span>:&nbsp;
                        {app.selection.length}
                    </div>
                    <div>
                        <span className="fixedWidth">Tool</span>:&nbsp;
                        {app.tool.name}
                    </div>
                    <div>
                        <span className="fixedWidth">Grid</span>:&nbsp;
                        {app.gridSize}
                    </div>
                </div>
                {app.rects.map((rect) => {
                    let style: React.CSSProperties = {
                        position: 'absolute',
                        border: '1px solid black',
                        boxSizing: 'border-box',
                        backgroundColor: 'rgba(200, 255, 200, .75)',
                        left: rect.left + 'px',
                        top: rect.top + 'px',
                        width: rect.width + 'px',
                        height: rect.height + 'px',
                        pointerEvents: 'none',
                    };
                    style.borderWidth = rect.borderWidth + "px";
                    style.borderRadius = rect.borderRadius + "px";
                    style.backgroundColor = rect.backgroundColor.toString();
                    style.padding = rect.padding;
                    if (app.tool.name == 'Select') {
                        if (app.isSelected(rect)) 
                            style.borderColor = 'rgb(100, 200, 255)';
                    }
                    return (<div key={rect.id} style={style}>{rect.text}</div>);
                })}
                <PropsWindow />
            </div>
        ), root);
    }

    class GridUnderlay extends React.Component<any, any> {
        private _cache = {
            data: "",
            gridSize: 0,
        };

        private renderBackground(div: HTMLDivElement) {
            if (!div) return;

            let gridSize = this.props.size as number;
            if (gridSize < 4) gridSize = 4;
            if (this._cache.gridSize != gridSize) {
                let canv = document.createElement('canvas');
                canv.width = gridSize;
                canv.height = gridSize;
                let ctx = canv.getContext('2d');
                ctx.moveTo(0, 0);
                ctx.lineTo(gridSize, 0);
                ctx.moveTo(0, 0);
                ctx.lineTo(0, gridSize);
                ctx.strokeStyle = 'lightgray';
                ctx.stroke();
                console.log("canvas drawn");

                this._cache.gridSize = gridSize;
                this._cache.data = `url(${canv.toDataURL()})`;
            }
            div.style.background = this._cache.data;
        }

        render(): JSX.Element {
            return <div ref={(r) => { this.renderBackground(r); }}
                style={{
                    display: 'inline-block', 
                    position: 'absolute', 
                    zIndex: -1,
                    left: 0, top: 0,
                    width: 2048, height: 2048,
                }}/>
        }
    }

    class SliderControl extends React.Component<any, any> {
    }

    class PropsWindow extends React.Component<any, any> {
        render(): JSX.Element {
            let theDiv: divmaker.Div = null;

            if (app.selection.length > 0) {
                theDiv = app.selection[0];
            }

            let style: React.CSSProperties = {
                position: 'fixed', 
                right: 10, 
                bottom: 10, 
                minWidth: 64,
                minHeight: 32,
                backgroundColor: 'lightgray',
                borderWidth: '3px',
                borderStyle: 'outset',
                padding: '5px',
            };

            let stopProp = (evt: any) => {
                evt.stopPropagation();
            };

            let onChange = (evt: any) => {
                theDiv.borderWidth = evt.target.value;
            };

            let onBackgroundColorChange = (comp: 'r'|'g'|'b'|'a', evt:any) => {
                //console.log("bg col change");
                let {r:r,g:g,b:b,a:a} = theDiv.backgroundColor;
                let col = {r:r,g:g,b:b,a:a};
                col[comp] = Number(evt.target.value);
                theDiv.backgroundColor = new divmaker.Color(col.r, col.g, col.b, col.a);
            };
            let onBgChange = {
                'r': _.partial(onBackgroundColorChange, 'r'),
                'g': _.partial(onBackgroundColorChange, 'g'),
                'b': _.partial(onBackgroundColorChange, 'b'),
                'a': _.partial(onBackgroundColorChange, 'a'),
            };

            let onChangeBorderRadius = (evt: any) => {
                theDiv.borderRadius = Number(evt.target.value);
            };

            let onTextChange = (evt: any) => {
                theDiv.text = evt.target.value;
            };

            let onPadding = (evt: any) => {
                theDiv.padding = Number(evt.target.value);
            };

            let ui = [
                // backgroundColor
                // borderColor
                // borderWidth
                // padding
                // text
            ];

            return (theDiv) ? 
                <div style={style} onMouseDown={stopProp} onMouseUp={stopProp}
                    onMouseMove={stopProp} onClick={stopProp}>
                    <div>
                        background-color:<br/>
                        R: <input type='range' min={0} max={255} 
                            value={theDiv.backgroundColor.r} 
                            onChange={onBgChange.r}/><br/>
                        G: <input type='range' min={0} max={255} 
                            value={theDiv.backgroundColor.g} 
                            onChange={onBgChange.g}/><br/>
                        B: <input type='range' min={0} max={255} 
                            value={theDiv.backgroundColor.b} 
                            onChange={onBgChange.b}/><br/>
                        A: <input type='range' min={0} max={1} 
                            value={theDiv.backgroundColor.a} 
                            step={0.01}
                            onChange={onBgChange.a}/><br/>
                        border-width:<br/>
                        <input type='range' min={0} max={32} 
                            value={theDiv.borderWidth} onChange={onChange}/><br/>
                        border-radius:<br/>
                        <input type='range' min={0} max={128} 
                            value={theDiv.borderRadius} onChange={onChangeBorderRadius}/><br/>
                        text:<br/>
                        <textarea rows={3} cols={16} onChange={onTextChange} 
                            value={theDiv.text} /><br/>
                        padding:<br />
                        <input type='range' min={0} max={64} value={theDiv.padding} 
                            onChange={onPadding}/><br/>
                    </div> 
                </div>
                : null;
        }
    }
}

export default browser;