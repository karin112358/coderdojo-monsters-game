import p5 from "p5";
import { Game } from "../game";
import { Scene } from "./scene";

export class Dungeon extends Scene {
  draw(p: p5) {
    this.drawBackground(p);

    // monsters
    let i = 0;

    p.noStroke();
    p.textSize(20);
    for (let player of this.game.players) {
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(player.name, (i % 8) * 100 + 50, Math.floor(i / 8) * 100 + 100);

      p.image(
        this.game.monsters[player.monsterId],
        (i % 8) * 100,
        Math.floor(i / 8) * 100,
        100,
        100
      );

      i++;
    }
  }

  mouseClicked(p: p5) {}

  private drawBackground(p: p5) {
    p.image(this.game.background, 0, 0, 1600, 800);
  }
}
