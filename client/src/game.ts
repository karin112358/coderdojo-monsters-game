import p5 from "p5";
import io from "socket.io-client";

import { Dungeon } from "./scenes/dungeon";
import { Intro } from "./scenes/intro";
import { Scene } from "./scenes/scene";
import { Player } from "./player";

export class Game {
  background: p5.Image;
  monsters: p5.Image[] = [];
  activeScene: Scene;
  players: Player[];

  private socket: SocketIOClient.Socket;

  private nameInput: p5.Element;
  private button: p5.Element;

  constructor(private server: string) {
    this.activeScene = new Intro(this);

    // handle socket.io
    this.socket = io.connect(this.server);

    this.socket.on("error", (error: string) => {
      alert(error);
    });

    this.socket.on("joinedGame", players => {
      this.button.remove();
      this.nameInput.remove();

      this.players = players;
      this.activeScene = new Dungeon(this);
    });

    this.socket.on("playerJoinedGame", player => {
      console.log("new Player", player);
      this.players.push(player);
    });

    this.socket.on("playerLeftGame", player => {
      const index = this.players.findIndex(p => p.name === player.name);
      if (index >= 0) {
        this.players.splice(index, 1);
      }
    });
  }

  loadResources(p: p5) {
    this.background = p.loadImage(this.server + "background.png");

    for (let i = 1; i <= 40; i++) {
      this.monsters.push(
        p.loadImage(this.server + "monsters/" + i.toString() + ".png")
      );
    }
  }

  setup(p: p5) {
    p.createCanvas(800, 800);

    // player name input
    this.nameInput = p.createInput("");
    this.nameInput.center();
    this.nameInput.elt.focus();

    this.button = p.createButton("Join Game");
    this.button.center();
    this.button.elt.type = "submit";

    this.button.mouseClicked(() => {
      this.socket.emit(
        "joinGame",
        this.nameInput.value(),
        (<Intro>this.activeScene).selectedMonster
      );
    });
  }
}
