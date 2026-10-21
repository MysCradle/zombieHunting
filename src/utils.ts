import { GameObject } from "@framekore/core"
import { Vector2 } from "@framekore/math"
import type { Entity } from "./Objects/Entity"

export class Alarm extends GameObject {
    alarm = -1
    #action?: () => void

    setAlarm(frames: number, action?: () => void) {
        this.alarm = frames
        this.#action = action
    }

    onAlarm(action: () => void): void {
        action?.()
    }

    fixedUpdate(delta: number): void {
        super.fixedUpdate?.(delta)

        if (this.alarm > 0) {
            this.alarm--
            if (this.alarm <= 0) {
                this.alarm = -1
                if (this.#action) {
                    this.onAlarm(this.#action);
                }
            }
        }
    }
}

export function randomNumber(x: number, y: number): number {
    return Math.random() * (y - x) + x;
}

export function choose<T>(...options: T[]): T {
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
}

export function knockback(
    target: Entity,
    origin: Entity,
    force: number
) {
    const direction = Vector2.sub(
        target.transform.position,
        origin.transform.position
    ).normalize()

    target.body.applyForce(
        direction.x * force,
        direction.y * force
    )
}

export function resetFont(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'black'
    ctx.strokeStyle = 'black'
    ctx.font = "16px arial"
}