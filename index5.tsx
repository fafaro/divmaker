import * as $ from 'jquery';

function main() {
    let btn1 = $("<input type='button' value='A'></input>");
    let btn2 = $("<input type='button' value='B'></input>");
    let btn3 = $("<input type='button' value='C'></input>");
    let buttons = [btn1, btn2, btn3];

    function setToggled(button, state) {
        button.css({ "background-color": state ? "red" : "unset" });
    }

    function selectToggle(button) {
        for (let b of buttons) {
            if (b == button) setToggled(b, true);
            else setToggled(b, false);
        }
    }

    for (let btn of buttons) {
        btn.click((obj) => { selectToggle(btn) });
    }

    $("#app").append(btn1, btn2, btn3);
}
window.onload = main;