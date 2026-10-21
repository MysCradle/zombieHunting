import { CollisionLayer } from "@framekore/physics2d";
import { type CollisionOptions } from "./Collision";
import { Engine } from "@framekore/core";
import { AssetManager } from '@framekore/asset-manager'
import zombie from "../assets/images/zombie.png"
import { AnimatedSprite2D, Animator2D, Texture, type Renderable } from "@framekore/render2d";
import { InputManager } from "@framekore/input-manager";
import { Vector2 } from "@framekore/math";
import type { Player } from "./Player";
import { Alarm, knockback } from "../utils";
import { Entity } from "./Entity";

export class Enemy extends Entity implements Renderable {
    assets: AssetManager
    animator: Animator2D

    hp: number = 5

    target?: Player

    alarm0: Alarm
    alarm1: Alarm

    hittable = true

    damage = 1

    input: InputManager

    SPEED = .4
    STOPPING_DISTANCE = 7

    key = {
        up: 0,
        left: 0,
        down: 0,
        right: 0,
        confirm: 0,
        jump: 0
    }

    constructor(engine: Engine, options: CollisionOptions) {
        super(engine, options)
        console.log('neh');

        this.alarm0 = new Alarm(engine)
        this.alarm1 = new Alarm(engine)
        this.assets = AssetManager.get(engine)
        this.animator = new Animator2D(engine)
        this.input = InputManager.get(engine)

        this.assets.load("enemy", "image", zombie).then((img) => {
            const texture = new Texture(img)
            texture.slice(7, 10)
            const spritFront = new AnimatedSprite2D(engine, texture)
            spritFront.target = this
            spritFront.addFrame(0, 0)
            spritFront.addFrame(1, 0)
            const spritBack = new AnimatedSprite2D(engine, texture)
            spritBack.target = this
            spritBack.addFrame(0, 1)
            spritBack.addFrame(1, 1)
            spritBack.fps = 5
            spritFront.fps = 5
            this.animator.add('front', spritFront)
            this.animator.add('back', spritBack)
            this.animator.play('front')
        })

        this.body.useGravity = false

        this.addComponent(this.animator)

        this.transform.scale.x = 1
        this.transform.scale.y = 1
        this.collision.layer = CollisionLayer.Layer2
        this.collision.mask = CollisionLayer.Layer1
    }

    hit(frames: number, other: Entity, force: number) {
            this.hittable = false
            knockback(this, other, force)
            this.alarm0.setAlarm(frames, () => {
                this.hittable = true
            })
            this.alarm1.setAlarm(10, () => {
                this.body.velocity.x=0
                this.body.velocity.y=0
            })
        }

    fixedUpdate(delta: number): void {
        if (this.destroyed) return
        super.fixedUpdate?.(delta)
        this.alarm0.fixedUpdate(delta)
        this.alarm1.fixedUpdate(delta)

        if (!this.target)
            return
        const dist = this.transform.position.distanceTo(this.target.transform.position)

        if (dist > this.STOPPING_DISTANCE) {
            const direction = Vector2.sub(this.target.transform.position, this.transform.position).normalize()
            direction.mul(this.SPEED)
            this.transform.position.add(direction)
        }

    }

    update(delta: number): void {
        super.update?.(delta)

        this.animator.zIndex = this.transform.position.y

        if (this.hp <= 0) {
            this.destroy();
            this.collision.mask = 0;
            this.collision.layer = 0;
            this.animator.visible = false
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        
    }

    destroy(): void {
        this.destroyed = true
        this.animator.stop()
    }
}