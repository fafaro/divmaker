import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import * as $ from 'jquery';
import { MainLayout } from './parts/mainlayout';
import { StageModel, Stage } from './parts/stage';

export function main() {
    let stageModel = new StageModel();

    let mainCss = <style>{`
        * {
            font-family: tahoma;
        }
    `}</style>;
    let root = 
        <div>
            <Stage model={stageModel} />
        {/*<MainLayout>
            <div data-layout-pos="left" title="Toolbox">
                <div>Toolbox</div>
            </div>
            <div data-layout-pos="right" title="Properties">
                <div>Properties</div>
            </div>
            <div data-layout-pos="center">
                <Stage model={stageModel} />
            </div>
        </MainLayout>*/}
        </div>
    ReactDOM.render(mainCss, document.head);
    ReactDOM.render(root, document.getElementById("root"));
}