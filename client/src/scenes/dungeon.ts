import p5 from "p5";
import { Game } from "../game";
import { Player } from "../player";
import { Scene } from "./scene";

export class Dungeon extends Scene {
  background: p5.Image;
  star: p5.Image;
  offset = { x: 0, y: 0 };

  async loadResources(p: p5) {
    this.background = await this.loadImage(p, "background.png");
    this.star = await this.loadImage(p, "items/000_0019_star1.png");
  }

  draw(p: p5) {
    // calculate offset
    this.offset = {
      x: Math.min(Math.max(0, this.game.self.x - p.width / 2), this.game.configuration.width - p.width),
      y: Math.min(Math.max(0, this.game.self.y - p.height / 2), this.game.configuration.height - p.height)
    };

    // background
    this.drawBackground(p);

    // stars
    this.drawStars(p);

    // monsters
    p.noStroke();
    p.textSize(20);
    for (let player of this.game.players) {
      this.drawPlayer(p, player);
    }

    this.drawPlayer(p, this.game.self);

    // move monster
    let speed = 2;
    let x = this.game.self.x;
    let y = this.game.self.y;

    if (p.mouseX > this.game.self.x - this.offset.x + 10) {
      x = this.game.self.x + speed;
    } else if (p.mouseX < this.game.self.x - this.offset.x - 10) {
      x = this.game.self.x - speed;
    }

    if (p.mouseY > this.game.self.y - this.offset.y + 10) {
      y = this.game.self.y + speed;
    } else if (p.mouseY < this.game.self.y - this.offset.y - 10) {
      y = this.game.self.y - speed;
    }

    this.game.self.x = Math.min(Math.max(0, x), this.game.configuration.width);
    this.game.self.y = Math.min(Math.max(0, y), this.game.configuration.height);

    this.game.updatePosition();
  }

  mouseClicked(p: p5) { }

  private drawBackground(p: p5) {
    p.image(
      this.background, 
      0 - this.offset.x, 
      0 - this.offset.y, 
      this.game.configuration.width, 
      this.game.configuration.height);
  }

  private drawPlayer(p: p5, player: Player) {
    p.textAlign(p.CENTER, p.BOTTOM);

    p.text(player.name, player.x - this.offset.x, player.y + player.size / 2 - this.offset.y);
    p.image(
      this.game.monsters[player.monsterId],
      player.x - player.size / 2 - this.offset.x,
      player.y - player.size / 2 - this.offset.y,
      player.size,
      player.size
    );
  }

  private drawStars(p: p5) {
    let size = 20;

    for (let star of this.game.stars) {
      p.image(
        this.star,
        star.x - size / 2 - this.offset.x,
        star.y - size / 2 - this.offset.y,
        star.size,
        star.size
      );
    }
  }
}
