import p5 from "p5";
import { Game } from "../game";

export abstract class Scene {
  isInitialized = false;
  
  constructor(protected game: Game) { }

  async loadResources(p: p5) { }

  setup(p: p5) { }

  draw(p: p5) { }

  mouseClicked(p: p5) { }

  destroy(p: p5) { }

  async loadImage(p: p5, url: string): Promise<p5.Image> {
    return new Promise<p5.Image>(resolve => {
      p.loadImage(
        this.game.server + url,
        (image) => resolve(image));
    });
  }
}
