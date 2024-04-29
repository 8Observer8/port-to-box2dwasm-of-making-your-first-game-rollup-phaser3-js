import { box2d, initBox2D } from "./init-box2d.js";
import { WEBGL, Game, Scale } from 'phaser3';

const config = {
    type: WEBGL,

    canvas: document.getElementById('renderCanvas'),
    width: 800,
    height: 600,
    scaleMode: Scale.ScaleModes.FIT,
    autoCenter: Scale.Center.CENTER_BOTH,

    autoFocus: true,
    scene: { preload, create, update },
    backgroundColor: '#555'
};

const game = new Game(config);

function preload() {}

async function create() {
    await initBox2D();

    const {
        b2Vec2,
        b2World
    } = box2d;

    this.world = new b2World();
    const gravity = new b2Vec2(0, 10);
    this.world.SetGravity(gravity);
    console.log(`gravity = (x: ${this.world.GetGravity().x}, ` +
        `y: ${this.world.GetGravity().y})`);
}

function update() {}
