import * as React from 'react';
import * as ReactDOM from 'react-dom';

type JE = JSX.Element;

namespace MainLayout {
    export interface Props {
        children: JE[];
    }
    export interface State {

    }
}
export class MainLayout extends React.Component<MainLayout.Props, MainLayout.State> {
    public constructor(props: MainLayout.Props) {
        super(props);
    }

    public render(): JE {
        console.log();
        let children = MainLayout.destructureChildren(this.props.children);
        let {left:left, center:center, right:right} = children;
        let s1 = {border: "1px solid black"};

        let leftPanelWidth = 60;
        let rightPanelWidth = 100;

        let mainStyle = {
            //border: "1px solid red",
            position: "absolute" as "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        };

        let panelStyle = {
            position: "absolute" as "absolute",
            boxSizing: "border-box" as "border-box",
            border: "3px",
            borderStyle: "outset" as "outset",
            backgroundColor: "lightgray",
            padding: "3px",
            overflow: "hidden",
            fontSize: "8pt",
        };

        let leftStyle = Object.assign({}, panelStyle, {
            left: 0,
            top: 0,
            bottom: 0,
            width: leftPanelWidth + "px",
        });

        let centerStyle = {
            border: "1px solid black",
            position: "absolute" as "absolute",
            padding: "10px",
            left: leftPanelWidth,
            top: 0,
            bottom: 0,
            right: rightPanelWidth,
            overflow: "auto",
        };

        let rightStyle = Object.assign({}, panelStyle, {
            right: 0,
            top: 0,
            bottom: 0,
            width: rightPanelWidth + "px",
        });

        function applyStyle(elem: JE, style: object): JE {
            let existingStyle = elem.props.style;
            let newStyle = Object.assign({}, existingStyle, style);
            let result = React.cloneElement(elem, {style: newStyle});
            return result;
        }

        return (
            <div style={mainStyle}>
                { applyStyle(left, leftStyle) }
                { applyStyle(center, centerStyle) }
                { applyStyle(right, rightStyle) }
            </div>
        );
    }

    private static destructureChildren(children: JE[]): { left: JE, center: JE, right: JE} {
        var left, center, right;
        for (let child of children) {
            switch (child.props["data-layout-pos"]) {
                case "left": left = child; break;
                case "right": right = child; break;
                default: center = child; break;
            }
        }
        return {left: left, center: center, right: right};
    }
}

