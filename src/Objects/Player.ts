import { CollisionLayer } from "@framekore/physics2d";
import { type CollisionOptions } from "./Collision";
import { Engine } from "@framekore/core";
import { AssetManager } from '@framekore/asset-manager'
import player from "../assets/images/player.png"
import { AnimatedSprite2D, Animator2D, Texture, type Renderable } from "@framekore/render2d";
import { InputManager } from "@framekore/input-manager";
import { controls } from "../controls";
import { Vector2 } from "@framekore/math";
import { Alarm, knockback } from "../utils";
import { Entity } from "./Entity";

export class Player extends Entity implements Renderable {
    assets: AssetManager
    animator: Animator2D

    hittable = true

    alarm0: Alarm
    alarm1: Alarm

    hp: number = 5

    input: InputManager

    SPEED = 1

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
        this.assets = AssetManager.get(engine)
        this.animator = new Animator2D(engine)
        this.input = InputManager.get(engine)

        this.alarm0 = new Alarm(engine)
        this.alarm1 = new Alarm(engine)

        this.assets.load("player", "image", player).then((img) => {
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

    update(delta: number): void {
        super.update?.(delta)
        if (this.destroyed) return;
        this.animator.zIndex = this.transform.position.y
    }

    fixedUpdate(delta: number): void {
        super.fixedUpdate?.(delta)
        if (this.destroyed) return;
        this.alarm0.fixedUpdate(delta)
        this.alarm1.fixedUpdate(delta)
        this.key.up = Number(this.input.isDown(controls.up))
        this.key.down = Number(this.input.isDown(controls.down))
        this.key.left = Number(this.input.isDown(controls.left))
        this.key.right = Number(this.input.isDown(controls.right))
        if (this.key.up) {
            this.animator.play('back')
        }
        if (this.key.down) {
            this.animator.play('front')
        }
        const vspd = (this.key.down - this.key.up)
        const hspd = (this.key.right - this.key.left)

        const direction = new Vector2(hspd, vspd).normalize()
        direction.mul(this.SPEED)

        this.transform.position.add(direction)

        if (this.hp <= 0) {
            this.destroy()
            this.animator.stop()
            this.body.velocity.x=0
            this.body.velocity.y=0
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        
    }
}

