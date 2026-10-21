import { Engine, GameObject, Scene } from "@framekore/core";
import { Player } from "../Objects/Player";
import { Vector2 } from "@framekore/math";
import { RenderManager2D } from "@framekore/render2d";
import { Camera } from "../Objects/Camera";
import { Faca } from "../Armas/faca";
import { Physics2D } from "@framekore/physics2d";
import { Alarm, choose, randomNumber, resetFont } from "../utils";
import { Enemy } from "../Objects/Enemy";
import { controls } from "../controls";
import { InputManager } from "@framekore/input-manager";

export class Cena extends Scene {
    player: Player
    camera: Camera
    #items = new Map<string, GameObject>
    zombies: Enemy[] = []

    invoque = true

    alarm0: Alarm

    render: RenderManager2D

    end: boolean = false

    input: InputManager

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
            position: choose(
                new Vector2(
                    choose(0, this.render.canvas.width),
                    randomNumber(0, this.render.canvas.height),
                ),
                new Vector2(
                    randomNumber(0, this.render.canvas.width),
                    choose(0, this.render.canvas.height)
                )
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
        this.input = InputManager.get(engine)
        
        resetFont(this.render.ctx)
        this.player = new Player(engine, {
            position: new Vector2(200, 200),
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
                width: this.render.canvas.width,
                height: this.render.canvas.height
            },
            deadZoneHeight: 14,
            deadZoneWidth: 20,
        })

        const faca = new Faca(engine, {
            position: new Vector2(200, 250),
            height: 7,
            width: 10
        })

        this.addItem('faca1', faca)
        this.camera.zoom = 3
        this.camera.transform.position = this.player.transform.position

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
        this.drawBackground()
        if (this.input.isDown('KeyR')) {
            this.engine.setScene(new Cena(this.engine))
        }
        if (!this.invoque && this.zombies.length < 10) {
            this.spawnZombie(this.engine)
        }

        this.render.drawScreen(ctx => {
            ctx.fillText(String(Math.trunc(this.player.transform.position.x)) + 'x' + String(Math.trunc(this.player.transform.position.y)) + " : " + this.player.hp, 10, 20)

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
        if (this.player.hp <= 0) {
            this.render.drawScreen(ctx => {
                const x = this.render.canvas.width / 2
                const y = this.render.canvas.height / 2
                ctx.font = 'bold 16px arial'
                ctx.fillStyle = "#ffffff"
                ctx.strokeStyle = "#000000"
                ctx.lineWidth = .7
                ctx.textAlign = "center"
                ctx.fillText('Press R to Return', x, y)
                ctx.strokeText('Press R to Return', x, y)
                resetFont(ctx)
            })

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
                    zombie.hit(30, faca, 100)
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
                    this.player.hit(60, zombie, 100)
                    this.end = true
                }
            }
        }
    }

    drawBackground() {
        this.render.draw((ctx) => {
            const colors = [
                '#3a7a5e', // verde base menos vibrante
                '#3ea06d',
                '#45c67a',
                '#5bdc94',
            ];
            const { width, height } = this.render.canvas;
            // 1️⃣ Opacidade global (0‑1) → deixa o fundo translúcido
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = colors[0];
            ctx.fillRect(0, 0, width, height);
            const step = 4;
            for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                    const noise = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
                    const rnd = noise - Math.floor(noise);
                    // Tornar a probabilidade menor (ex.: 0.6) = menos tufos
                    if (rnd > 0.6) {
                        let idx = Math.floor(rnd * colors.length);
                        if (y < height / 3) idx = Math.min(idx + 1, 4);
                        ctx.fillStyle = colors[idx];
                        ctx.fillRect(x, y, step, step); // preenche o bloco inteiro
                    }
                }
            }
            // 4️⃣ Reseta a opacidade para o restante da cena (HUD etc.)
            ctx.globalAlpha = 1.0;
        }, -100);
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
