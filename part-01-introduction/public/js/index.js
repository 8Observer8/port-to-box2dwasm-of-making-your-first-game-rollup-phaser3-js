import Box2DLib from 'box2d-wasm';
import { WEBGL, Scale, Game } from 'phaser3';

let box2d = null;

function initBox2D(localhost = true) {
    return new Promise(resolve => {
        Box2DLib().then((re) => {
            box2d = re;
            resolve();
        });
    });
}

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

new Game(config);

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
//# sourceMappingURL=index.js.map
