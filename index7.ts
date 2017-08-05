import Vue from 'vue'

function main() {
    var app = new Vue({
        el: "#app",
        data: {
            message: "Hello World"
        }
    });
}
window.onload = main;

