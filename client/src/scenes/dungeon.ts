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

    // other monsters
    p.noStroke();
    p.textSize(20);
    for (let player of this.game.players) {
      player.x = Math.min(Math.max(0, player.x + player.speedX), this.game.configuration.width);
      player.y = Math.min(Math.max(0, player.y + player.speedY), this.game.configuration.height);
      this.drawPlayer(p, player);
    }

    // self monster
    let speed = 2;
    if (p.keyIsPressed && p.key == 's' && this.game.self.energy > 0) {
      this.game.self.energy--;
      speed = 4;
    } else if ((!p.keyIsPressed || p.key != 's') && this.game.self.energy < 100) {
      this.game.self.energy += 0.5;
    }

    let speedX = 0;
    let speedY = 0;

    if (p.mouseX > this.game.self.x - this.offset.x + 10) {
      speedX = speed;
    } else if (p.mouseX < this.game.self.x - this.offset.x - 10) {
      speedX = speed * -1;
    }

    if (p.mouseY > this.game.self.y - this.offset.y + 10) {
      speedY = speed;
    } else if (p.mouseY < this.game.self.y - this.offset.y - 10) {
      speedY = speed * -1;
    }

    this.game.self.x = Math.min(Math.max(0, this.game.self.x + speedX), this.game.configuration.width);
    this.game.self.y = Math.min(Math.max(0, this.game.self.y + speedY), this.game.configuration.height);

    if (this.game.self.speedX != speedX || this.game.self.speedY != speedY || p.frameCount % 60 == 0) {
      this.game.self.speedX = speedX;
      this.game.self.speedY = speedY;
      this.game.updatePosition();
    }

    this.drawPlayer(p, this.game.self);

    this.drawEnergy(p);
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

  private drawEnergy(p: p5)  {
    // show energy
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text("Energy: " + this.game.self.energy.toString(), 10, 10);
  }
}
