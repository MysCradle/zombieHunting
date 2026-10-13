import { type Engine } from "@framekore/core";
import { Arma } from "../Objects/Arma";
import { RenderManager2D, Sprite2D, Texture } from "@framekore/render2d";
import faca from '../assets/faca.png'
import { AssetManager } from "@framekore/asset-manager";
import type { CollisionOptions } from "../Objects/Collision";
import type { Player } from "../Objects/Player";
import { Vector2 } from "@framekore/math";
import { Alarm } from "../utils";
import { controls } from "../controls";
import { InputManager } from "@framekore/input-manager";

export class Faca extends Arma {

    canvas: RenderManager2D
    assets: AssetManager
    sprite?: Sprite2D

    input: InputManager

    #mouseScreen = new Vector2
    #mouseClic: number | undefined
    damage = 3
    alarm0: Alarm

    state: 'abandoned' | 'attack' | 'using' = 'abandoned'

    constructor(engine: Engine, options: CollisionOptions, target?: Player) {
        super(engine, options, target)
        this.engine = engine
        this.canvas = RenderManager2D.get(engine)
        this.assets = AssetManager.get(engine)
        this.input = InputManager.get(engine)
        this.alarm0 = new Alarm(engine)

        const canvasElement = this.canvas.canvas;
        this.canvas.canvas.addEventListener("mousemove", (e) => {
            const rect = canvasElement.getBoundingClientRect();
            this.#mouseScreen.x = e.clientX - rect.left;
            this.#mouseScreen.y = e.clientY - rect.top;
        });

        this.canvas.canvas.addEventListener("mousedown", (e) => {
            this.#mouseClic = e.button
        })

        this.canvas.canvas.addEventListener("mouseup", () => {
            this.#mouseClic = undefined
        })

        this.assets.load('faca', "image", faca).then((img) => {
            const texture = new Texture(img)
            texture.slice(10, 7)
            this.sprite = new Sprite2D(engine, texture)
            this.sprite.target = this
            this.sprite.setFrame(0, 0)
            this.sprite.setAnchor(0.5, 0.5);

            this.animator.add('faca', this.sprite)
            this.animator.play('faca')
        })

        this.addComponent(this.animator)

    }

    update(delta: number): void {
        super.update?.(delta)
        if (!this.target)
            return
        if (this.state === "using" || this.state === "attack") {

            if (this.input.isJustDown(controls.get)) {
                this.state = "abandoned"
                this.target = undefined
            }
            

            const scene = this.engine.currentScene as any;
            const camera = scene?.camera;
            const canvas = this.canvas.canvas;
            let mouseWorldX = this.#mouseScreen.x;
            let mouseWorldY = this.#mouseScreen.y;
            if (camera) {
                mouseWorldX = (this.#mouseScreen.x - canvas.width / 2) / camera.zoom + camera.transform.position.x;
                mouseWorldY = (this.#mouseScreen.y - canvas.height / 2) / camera.zoom + camera.transform.position.y;
            }
            
            const dx = mouseWorldX - this.target.transform.position.x;
            const dy = mouseWorldY - this.target.transform.position.y;
            const angle = Math.atan2(dy, dx);
            this.transform.rotation = angle;
            
            const distanciaDaMao = this.state === "attack" ? 15 : 10;
            
            this.transform.position.x = this.target.transform.position.x + Math.cos(angle) * distanciaDaMao;
            this.transform.position.y = this.target.transform.position.y + Math.sin(angle) * distanciaDaMao;
            if (this.#mouseClic === 0 && this.state !== "attack") {
                this.attack();
            }
        }
    }

    fixedUpdate(delta: number): void {
        super.fixedUpdate?.(delta)
        this.alarm0.fixedUpdate(delta)
    }

    attack(): void {
        this.state = "attack"
        this.collision.width = 16;
        this.collision.height = 16;
        this.alarm0.setAlarm(10, () => {
            this.state = "using";
            this.collision.width = 10;
            this.collision.height = 7;
        });
    }
}