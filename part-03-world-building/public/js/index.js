import Box2DLib from 'box2d-wasm';
import { Display, WEBGL, Scale, Game } from 'phaser3';

let box2d = null;

function initBox2D(localhost = true) {
    return new Promise(resolve => {
        Box2DLib().then((re) => {
            box2d = re;
            resolve();
        });
    });
}

const sizeOfB2Vec2 = Float32Array.BYTES_PER_ELEMENT * 2;

class DebugDrawer {
    constructor(graphics, pixelsPerMeter) {
        this.graphics = graphics;
        this.pixelsPerMeter = pixelsPerMeter;
        this.lineWidth = 3;

        const {
            b2Color,
            b2Draw: { e_shapeBit },
            b2Vec2,
            JSDraw,
            wrapPointer
        } = box2d;

        const reifyArray = (array_p, numElements, sizeOfElement, ctor) =>
            Array(numElements)
            .fill(undefined)
            .map((_, index) =>
                wrapPointer(array_p + index * sizeOfElement, ctor)
            );

        self = this;
        const debugDrawer = Object.assign(new JSDraw(), {
            DrawSegment(vert1_p, vert2_p, color_p) {},
            DrawPolygon(vertices_p, vertexCount, color_p) {},
            DrawSolidPolygon(vertices_p, vertexCount, color_p) {
                const color = wrapPointer(color_p, b2Color);
                const vertices = reifyArray(vertices_p, vertexCount,
                    sizeOfB2Vec2, b2Vec2);
                self.drawLines(vertices, color);
            },
            DrawCircle(center_p, radius, color_p) {},
            DrawSolidCircle(center_p, radius, axis_p, color_p) {
                const center = wrapPointer(center_p, b2Vec2);
                const color = wrapPointer(color_p, b2Color);
                self.drawCircle(center.x * self.pixelsPerMeter, center.y * self.pixelsPerMeter,
                    radius * self.pixelsPerMeter, color);
            },
            DrawTransform(transform_p) {},
            DrawPoint(vertex_p, sizeMetres, color_p) {}
        });
        debugDrawer.SetFlags(e_shapeBit);
        this.instance = debugDrawer;
    }

    drawLines(vertices, color) {
        const c = new Display.Color().setGLTo(color.r, color.g, color.b, 1);
        this.graphics.lineStyle(this.lineWidth, c.color, 1.0);
        this.graphics.beginPath();
        this.graphics.moveTo(vertices[0].x * this.pixelsPerMeter, vertices[0].y * this.pixelsPerMeter);
        this.graphics.lineTo(vertices[1].x * this.pixelsPerMeter, vertices[1].y * this.pixelsPerMeter);
        this.graphics.lineTo(vertices[2].x * this.pixelsPerMeter, vertices[2].y * this.pixelsPerMeter);
        this.graphics.lineTo(vertices[3].x * this.pixelsPerMeter, vertices[3].y * this.pixelsPerMeter);
        this.graphics.lineTo(vertices[0].x * this.pixelsPerMeter, vertices[0].y * this.pixelsPerMeter);
        this.graphics.closePath();
        this.graphics.strokePath();
    }

    drawCircle(x0, y0, radius, color) {
        let angle = 0;
        const angleStep = 20;
        const n = 360 / angleStep;

        const c = new Display.Color().setGLTo(color.r, color.g, color.b, 1);
        this.graphics.lineStyle(this.lineWidth, c.color, 1);
        this.graphics.beginPath();

        let x = radius * Math.cos(angle * Math.PI / 180);
        let y = radius * Math.sin(angle * Math.PI / 180);
        this.graphics.moveTo(x0 + x, y0 + y);
        angle += angleStep;

        for (let i = 0; i < n; i++) {
            x = radius * Math.cos(angle * Math.PI / 180);
            y = radius * Math.sin(angle * Math.PI / 180);
            this.graphics.lineTo(x0 + x, y0 + y);
            angle += angleStep;
        }
        this.graphics.closePath();
        this.graphics.strokePath();
    }

    clear() {
        setTimeout(() => this.graphics.clear(), 0);
    }
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
    backgroundColor: '#555',

    callbacks: {
        preBoot: (game) => {
            game.scale.on('resize', onResize, game);
        }
    }
};

const debugInfoCheckBox = document.getElementById('debugInfoCheckBox');
let showDebugInfo = debugInfoCheckBox.checked;
debugInfoCheckBox.onchange = () => {
    showDebugInfo = debugInfoCheckBox.checked;
};

const debugInfoPanel = document.getElementById('debugInfoPanel');
new Game(config);

function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', {
        frameWidth: 32,
        frameHeight: 48
    });
}

function onResize() {
    const { right, top } = this.scale.canvasBounds;

    debugInfoPanel.style.top = `${top + 10}px`;
    debugInfoPanel.style.left = `${right - debugInfoPanel.clientWidth - 20}px`;
    debugInfoPanel.style.display = 'block';
}

async function create() {
    await initBox2D();

    const {
        b2_staticBody,
        b2BodyDef,
        b2PolygonShape,
        b2Vec2,
        b2World
    } = box2d;

    this.world = new b2World();
    const gravity = new b2Vec2(0, 10);
    this.world.SetGravity(gravity);
    this.pixelsPerMeter = 50;

    this.add.image(400, 300, 'sky');

    // Walls
    const walls = [];
    walls[0] = {
        x: 0,
        y: 300,
        w: 10,
        h: 600,
        xOffset: -5,
        yOffset: 0
    };
    walls[1] = {
        x: 800,
        y: 300,
        w: 10,
        h: 600,
        xOffset: 5,
        yOffset: 0
    };
    walls[2] = {
        x: 400,
        y: 0,
        w: 800,
        h: 10,
        xOffset: 0,
        yOffset: -5
    };
    for (let i = 0; i < walls.length; i++) {
        const shape = new b2PolygonShape();
        const halfWidth = walls[i].w / 2 / this.pixelsPerMeter;
        const halfHeight = walls[i].h / 2 / this.pixelsPerMeter;
        shape.SetAsBox(halfWidth, halfHeight);
        const bodyDef = new b2BodyDef();
        bodyDef.type = b2_staticBody;
        const x = (walls[i].x + walls[i].xOffset) / this.pixelsPerMeter;
        const y = (walls[i].y + walls[i].yOffset) / this.pixelsPerMeter;
        bodyDef.set_position(new b2Vec2(x, y));
        const body = this.world.CreateBody(bodyDef);
        const fixture = body.CreateFixture(shape, 0);
        fixture.SetFriction(0);
    }

    // Platforms
    const platforms = [];
    platforms[0] = this.add.image(400, 568, 'ground').setScale(2);
    platforms[1] = this.add.image(600, 400, 'ground');
    platforms[2] = this.add.image(50, 250, 'ground');
    platforms[3] = this.add.image(750, 220, 'ground');
    for (let i = 0; i < platforms.length; i++) {
        const shape = new b2PolygonShape();
        const halfWidth = platforms[i].displayWidth / 2 / this.pixelsPerMeter;
        const halfHeight = platforms[i].displayHeight / 2 / this.pixelsPerMeter;
        shape.SetAsBox(halfWidth, halfHeight);
        const bodyDef = new b2BodyDef();
        bodyDef.type = b2_staticBody;
        const x = platforms[i].x / this.pixelsPerMeter;
        const y = platforms[i].y / this.pixelsPerMeter;
        bodyDef.set_position(new b2Vec2(x, y));
        const body = this.world.CreateBody(bodyDef);
        const fixture = body.CreateFixture(shape, 0);
        fixture.SetFriction(3);
    }

    this.graphics = this.add.graphics();
    this.debugDrawer = new DebugDrawer(this.graphics, this.pixelsPerMeter);
    this.world.SetDebugDraw(this.debugDrawer.instance);
}

function update() {
    if (!this.world) {
        return;
    }

    this.world.Step(0.016, 3, 2);

    if (showDebugInfo) {
        this.world.DebugDraw();
        this.debugDrawer.clear();
    }
}
//# sourceMappingURL=index.js.map
