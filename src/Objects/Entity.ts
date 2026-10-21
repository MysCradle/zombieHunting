import { Engine } from "@framekore/core";
import { Vector2 } from '@framekore/math'
import { Collision } from "./Collision";
import { RigidBody2D } from "@framekore/physics2d";

export interface CollisionOptions {
    width?: number
    height?: number
    position: Vector2
}

export class Entity extends Collision {
    body: RigidBody2D

    constructor(engine: Engine, options: CollisionOptions) {
        super(engine, options)
        this.engine = engine

        this.body = new RigidBody2D(this)

    }

    update(delta: number): void {
        if (this.destroyed) return

    }

    fixedUpdate(delta: number): void {
        if (this.destroyed) return
    }

    destroy(): void {
        if (this.destroyed) {
            return
        }
        this.destroyed = true;
        //
    }
}