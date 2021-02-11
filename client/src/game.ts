import p5 from "p5";
import io from "socket.io-client";

import { Dungeon } from "./scenes/dungeon";
import { Intro } from "./scenes/intro";
import { Scene } from "./scenes/scene";
import { Player } from "./player";
import { Star } from "./star";
import { Configuration } from "./configuration";

export class Game {
  background: p5.Image;
  monsters: p5.Image[] = [];
  activeScene: Scene;
  players: Player[];
  self: Player;
  stars: Star[];
  configuration: Configuration;

  private socket: SocketIOClient.Socket;

  private p: p5;
  private nameInput: p5.Element;
  private button: p5.Element;

  constructor(public server: string) {
    // handle socket.io
    this.socket = io.connect(this.server);

    this.socket.on("error", (error: string) => {
      alert(error);
    });

    this.socket.on("joinedGame", (game: any) => {
      this.button.remove();
      this.nameInput.remove();

      console.log('joined game', game);

      this.players = game.otherPlayers;
      this.self = game.self;
      this.stars = game.stars;

      this.changeScene(new Dungeon(this));
    });

    this.socket.on("playerJoinedGame", (player: any) => {
      console.log("new Player", player);
      if (this.players) {
        this.players.push(player);
      }
    });

    this.socket.on("playerUpdatedPosition", (player: Player) => {
      if (this.players) {
        const updatedPlayer = this.players.find(p => p.name === player.name);
        if (updatedPlayer) {
          updatedPlayer.x = player.x;
          updatedPlayer.y = player.y;
        }
      }
    });

    this.socket.on("playerLeftGame", (player: any) => {
      if (this.players) {
        const index = this.players.findIndex(p => p.name === player.name);
        if (index >= 0) {
          this.players.splice(index, 1);
        }
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

    this.configuration = <Configuration>p.loadJSON(this.server + "config.json");
  }

  setup(p: p5) {
    this.p = p;

    this.changeScene(new Intro(this));

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

  updatePosition() {
    this.socket.emit("updatePosition", { x: this.self.x, y: this.self.y });
  }

  private async changeScene(scene: Scene) {
    if (this.activeScene) {
      this.activeScene.destroy(this.p);
    }

    this.activeScene = scene;
    await this.activeScene.loadResources(this.p);
    this.activeScene.setup(this.p);
    this.activeScene.isInitialized = true;
  }
}
