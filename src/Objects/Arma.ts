import { Engine } from "@framekore/core";
import { Animator2D, type Renderable } from "@framekore/render2d";
import { Collision, type CollisionOptions } from "./Collision";
import type { Player } from "./Player";

export class Arma extends Collision implements Renderable {
    target?: Player
    animator: Animator2D

    constructor(engine: Engine, options: CollisionOptions, target?: Player) {
        super(engine, options) 
        this.engine = engine
        this.target = target
        this.animator = new Animator2D(engine)
        this.collision.isTrigger = true
    }

    render(ctx: CanvasRenderingContext2D): void {
        this.animator.render(ctx)
    }

    attack(): void {}

    
}