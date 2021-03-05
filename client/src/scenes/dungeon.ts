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
      this.game.self.energy = Math.max(0, this.game.self.energy - 1);
      speed = 4;
    } else if ((!p.keyIsPressed || p.key != 's') && this.game.self.energy < 100) {
      this.game.self.energy = Math.min(100, this.game.self.energy + 0.25)
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
    this.drawRanking(p);
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

    // check if other player is touched
    for (let player of this.game.players) {
      const dist = Math.sqrt(Math.pow(player.x - this.game.self.x, 2) + Math.pow(player.y - this.game.self.y, 2));
      if (dist < this.game.self.size / 4) {
        this.game.eatPlayer(player.name);
      }
    }

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
    for (let i = this.game.stars.length - 1; i >= 0; i--) {
      const star = this.game.stars[i];
      const dist = Math.sqrt(Math.pow(star.x - this.game.self.x, 2) + Math.pow(star.y - this.game.self.y, 2));

      if (dist < this.game.self.size / 4) {
        this.game.eatStar(star.x, star.y);
        this.game.stars.splice(i, 1);
      } else {
        p.image(
          this.star,
          star.x - star.size / 2 - this.offset.x,
          star.y - star.size / 2 - this.offset.y,
          star.size,
          star.size
        );
      }
    }
  }

  private drawEnergy(p: p5) {
    // show energy
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text("Energy: " + Math.floor(this.game.self.energy).toString(), 10, 10);
  }

  private drawRanking(p: p5) {
    const ranking: Player[] = [];
    ranking.push(this.game.self);
    ranking.push(...this.game.players);

    let top = 10;

    p.textAlign(p.RIGHT, p.TOP);
    ranking
      .sort((a, b) => (a.size < b.size ? 1 : -1))
      .forEach(r => {
        p.text(r.name + "   " + Math.floor(r.size), p.width - 10, top);
        top += 20;
      });
  }
}
