import "./style.scss";

import p5 from "p5";
import { Game } from "./src/game";

let game: Game;

function preload(p: p5) {
    //game = new Game("https://coderdojo-monsters-server.azurewebsites.net/");
    game = new Game("http://127.0.0.1:3000/");
    game.loadResources(p);
}

function setup(p: p5) {
    game.setup(p);
}

function draw(p: p5) {
    if (game.activeScene.isInitialized) {
        game.activeScene.draw(p);
    }
}

function mouseClicked(p: p5) {
    if (game.activeScene.isInitialized) {
        game.activeScene.mouseClicked(p);
    }
}

const p = new p5((p: p5) => {
    p.preload = () => preload(p);
    p.setup = () => setup(p);
    p.draw = () => draw(p);
    p.mouseClicked = () => mouseClicked(p);
    return p;
});
