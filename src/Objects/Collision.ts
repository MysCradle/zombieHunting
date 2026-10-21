import { Engine, GameObject } from "@framekore/core";
import { BoxCollide2D, CollisionLayer } from "@framekore/physics2d";
import { Transform2D } from '@framekore/transform2d'
import { Vector2 } from '@framekore/math'

export interface CollisionOptions {
    width?: number
    height?: number
    position: Vector2
}

export class Collision extends GameObject {
    transform: Transform2D
    collision: BoxCollide2D
    constructor(engine: Engine, options: CollisionOptions) {
        super(engine)
        this.engine = engine

        const width = options.width ?? 32
        const height = options.height ?? 32

        this.transform = new Transform2D()
        this.transform.position = options.position

        this.collision = new BoxCollide2D(this, width, height, {
            layer: CollisionLayer.Layer1,
            mask: CollisionLayer.Layer2
        })
    }

    update(delta: number): void {
        if (this.destroyed) return
        
    }

    fixedUpdate(delta: number): void {
        if (this.destroyed) return
    }

    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        //
    }
}