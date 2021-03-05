import { Scene } from "./scene";
import p5 from "p5";

export class Intro extends Scene {
  selectedMonster = 0;
  background: p5.Image;

  async loadResources(p: p5) {
    this.background = await this.loadImage(p, "background-pale.png");
  }

  setup(p: p5) {
  }

  draw(p: p5) {
    p.image(this.background, 0, 0, 1600, 800);

    // selected monster
    p.fill("#ffac38");
    p.stroke("#ffac38");
    p.strokeWeight(5);
    p.circle(
      (this.selectedMonster % 8) * 100 + 50,
      Math.floor(this.selectedMonster / 8) * 100 + 50,
      90
    );

    // mouse over monster
    if (p.mouseY <= 500) {
      p.stroke("#ffac38");
      p.noFill();
      let monsterIndex =
        Math.floor(p.mouseX / 100) + Math.floor(p.mouseY / 100) * 8;
      p.circle(
        (monsterIndex % 8) * 100 + 50,
        Math.floor(monsterIndex / 8) * 100 + 50,
        90
      );
    }

    // monsters
    for (let i = 0; i < 40; i++) {
      p.image(
        this.game.monsters[i],
        (i % 8) * 100,
        Math.floor(i / 8) * 100,
        100,
        100
      );
    }
  }

  mouseClicked(p: p5) {
    if (p.mouseY <= 500) {
      this.selectedMonster =
        Math.floor(p.mouseX / 100) + Math.floor(p.mouseY / 100) * 8;
    }
  }
}
