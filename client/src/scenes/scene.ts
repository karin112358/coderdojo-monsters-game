import p5 from "p5";
import { Game } from "../game";

export abstract class Scene {
  constructor(protected game: Game) {}

  abstract draw(p: p5);

  abstract mouseClicked(p: p5);
}
