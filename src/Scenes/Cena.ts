import { Engine, GameObject, Scene } from "@framekore/core";
import { Player } from "../Objects/Player";
import { Vector2 } from "@framekore/math";
import { RenderManager2D } from "@framekore/render2d";
import { Camera } from "../Objects/Camera";
import { Faca } from "../Armas/faca";
import { Physics2D } from "@framekore/physics2d";
import { Alarm, choose, randomNumber } from "../utils";
import { Enemy } from "../Objects/Enemy";
import { controls } from "../controls";

export class Cena extends Scene {
    player: Player
    camera: Camera
    #items = new Map<string, GameObject>
    zombies: Enemy[] = []

    invoque = true

    alarm0: Alarm

    render: RenderManager2D

    addItem(id: string, obj: GameObject) {
        if (this.#items.get(id)) return
        this.#items.set(id, obj)
    }
    getItem(id: string) {
        return this.#items.get(id)
    }

    spawnZombie(engine: Engine) {
        if (this.zombies.length >= 10) {
            this.invoque = false
            return
        }
        const zombie = new Enemy(engine, {
            position: new Vector2(
                randomNumber(0, this.render.canvas.width),
                randomNumber(0, this.render.canvas.height),
            ),
            height: 7,
            width: 10
        })
        zombie.target = this.player
        this.zombies.push(zombie)
        this.add(zombie)
        this.alarm0.setAlarm(choose(30, 120, 160), () => {
            this.spawnZombie(engine)
        })
    }

    constructor(engine: Engine) {
        super(engine)

        this.alarm0 = new Alarm(engine)

        this.alarm0.setAlarm(choose(30, 120, 160), () => {
            this.spawnZombie(engine)
            console.log("Zumbi gerado!");
        })

        this.add(this.alarm0)

        this.render = RenderManager2D.get(engine)
        this.player = new Player(engine, {
            position: new Vector2(400, 350),
            width: 7,
            height: 10
        })

        this.camera = new Camera(engine, {
            isMain: true,
            target: this.player,
            followSpeed: 1,
            worldBounds: {
                x: 0,
                y: 0,
                width: 800,
                height: 800
            },
            deadZoneHeight: 14,
            deadZoneWidth: 20,
        })

        const faca = new Faca(engine, {
            position: new Vector2(400, 400),
            height: 7,
            width: 10
        })

        this.addItem('faca1', faca)
        this.camera.zoom = 4
        this.camera.transform.position = new Vector2(400, 350)

        this.render = RenderManager2D.get(engine)
    }

    onEnter(): void {
        this.add(this.player)
        this.add(this.camera)
        const faca = this.getItem('faca1')
        if (faca)
            this.add(faca)
    }

    update(delta: number): void {
        super.update(delta)

        if (!this.invoque && this.zombies.length < 10) {
            this.spawnZombie(this.engine)
        }

        this.render.drawScreen(ctx => {
            ctx.fillText(String(Math.trunc(this.player.transform.position.x)) + 'x' + String(Math.trunc(this.player.transform.position.y)) + " : " + this.player.hp, 10, 10)

        })
        const faca = this.getItem('faca1') as Faca
        const physics = this.engine.getResource(Physics2D);

        if (physics.checkCollision(this.player, faca)) {
            if (!faca.target && faca.state === "abandoned") {
                if (faca.input.isJustDown(controls.get)) {
                    faca.target = this.player
                    faca.state = "using"
                }
            }
        }
        if (faca && faca.state === "attack") {
            const alcance = 40;
            const alcanceAoQuadrado = alcance * alcance;

            for (let i = this.zombies.length - 1; i >= 0; i--) {
                const zombie = this.zombies[i];

                const dx = zombie.transform.position.x - faca.transform.position.x;
                const dy = zombie.transform.position.y - faca.transform.position.y;
                const distSq = dx * dx + dy * dy;

                if (distSq > alcanceAoQuadrado) continue;

                if (physics.checkCollision(faca, zombie)) {
                    if (!zombie.hittable)
                        return
                    zombie.hp -= faca.damage
                    zombie.hit(30)
                    if (zombie.hp <= 0) {
                        this.zombies.splice(i, 1);
                    }
                }
            }
        }
        if (this.player) {
            const alcance = 40;
            const alcanceAoQuadrado = alcance * alcance;

            for (let i = this.zombies.length - 1; i >= 0; i--) {
                const zombie = this.zombies[i];

                const dx = zombie.transform.position.x - faca.transform.position.x;
                const dy = zombie.transform.position.y - faca.transform.position.y;
                const distSq = dx * dx + dy * dy;

                if (distSq > alcanceAoQuadrado) continue;

                if (physics.checkCollision(this.player, zombie)) {
                    if (!this.player.hittable)
                        return
                    this.player.hp -= zombie.damage
                    this.player.hit(60)
                }
            }
        }
    }
    fixedUpdate(delta: number): void {
        super.fixedUpdate(delta)
        this.alarm0.fixedUpdate(delta)
    }

    remove(obj: GameObject): void {
        const index = this.objects.indexOf(obj);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
        for (const comp of obj.getComponents()) {
            this.remove(comp);
        }
    }
}
