import p5 from "p5";
import io from "socket.io-client";

import { Dungeon } from "./scenes/dungeon";
import { Intro } from "./scenes/intro";
import { Scene } from "./scenes/scene";
import { Player } from "./player";
import { Star } from "./star";
import { Configuration } from "./configuration";

export class Game {
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

      if (error == "Player not valid") {
        this.restart();
      }
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
          updatedPlayer.speedX = player.speedX;
          updatedPlayer.speedY = player.speedY;
        }
      }
    });

    this.socket.on("playerUpdatedSize", (player: Player) => {
      if (this.players) {
        const updatedPlayer = this.players.find(p => p.name === player.name);
        if (updatedPlayer) {
          updatedPlayer.size = player.size;
        }
      }
    });

    this.socket.on("updatedSize", (size: number) => {
      if (this.players) {
        this.self.size = size;
      }
    });

    this.socket.on("starsUpdated", (stars: Star[]) => {
      this.stars = stars;
    });

    this.socket.on("playerLeftGame", (player: any) => {
      if (this.players) {
        const index = this.players.findIndex(p => p.name === player.name);
        if (index >= 0) {
          this.players.splice(index, 1);
        }
      }
    });

    this.socket.on("gameOver", (player: any) => {
      if (this.players) {
        console.log("game over", player, this.self.name)
        if (player.name == this.self.name) {
          this.socket.disconnect();
          alert("GAME OVER");
          this.socket.connect();
          this.restart();
        } else {
          const index = this.players.findIndex(p => p.name === player.name);
          if (index >= 0) {
            this.players.splice(index, 1);
          }
        }
      }
    });

    this.socket.on("connect_error", () => {
      if (this.self) {
        alert("Der Server ist nicht erreichbar.");
        this.restart();
      }
    });
  }

  loadResources(p: p5) {
    for (let i = 1; i <= 40; i++) {
      this.monsters.push(
        p.loadImage(this.server + "monsters/" + i.toString() + ".png")
      );
    }

    this.configuration = <Configuration>p.loadJSON(this.server + "config.json");
  }

  setup(p: p5) {
    p.createCanvas(800, 800);

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
    this.socket.emit("updatePosition", { x: this.self.x, y: this.self.y, speedX: this.self.speedX, speedY: this.self.speedY });
  }

  eatStar(x: number, y: number) {
    this.socket.emit("eatStar", x, y);
  }

  eatPlayer(name: string) {
    this.socket.emit("eatPlayer", name);
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

  private restart() {
    this.players = null;
    this.self = null;
    this.setup(this.p);
  }
}
