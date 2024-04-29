import { box2d, initBox2D } from "./init-box2d.js";
import { WEBGL, Game, Scale } from 'phaser3';
import DebugDrawer from './debug-drawer.js';
import RayCastCallback from './ray-cast-callback.js';

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

let playerBody;

const debugInfoCheckBox = document.getElementById('debugInfoCheckBox');
let showDebugInfo = debugInfoCheckBox.checked;
debugInfoCheckBox.onchange = () => {
    showDebugInfo = debugInfoCheckBox.checked;
};

const debugInfoPanel = document.getElementById('debugInfoPanel');
const game = new Game(config);

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
        b2_dynamicBody,
        b2_staticBody,
        b2BodyDef,
        b2CircleShape,
        b2PolygonShape,
        b2Vec2,
        b2World,
        getPointer
    } = box2d;

    this.world = new b2World();
    const gravity = new b2Vec2(0, 10);
    this.world.SetGravity(gravity);
    this.pixelsPerMeter = 50;
    const metaData = {};

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
        metaData[getPointer(fixture)] = {
            name: 'wall'
        };
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
        metaData[getPointer(fixture)] = {
            name: 'platform'
        };
    }

    this.player = this.add.sprite(100, 450, 'dude');

    const playerShape = new b2CircleShape();
    playerShape.m_radius = 20 / this.pixelsPerMeter;
    const playerBodyDef = new b2BodyDef();
    playerBodyDef.type = b2_dynamicBody;
    const playerPosX = this.player.x / this.pixelsPerMeter;
    const playerPosY = this.player.y / this.pixelsPerMeter;
    playerBodyDef.set_position(new b2Vec2(playerPosX, playerPosY));
    playerBody = this.world.CreateBody(playerBodyDef);
    playerBody.SetFixedRotation(true);
    const playerFixture = playerBody.CreateFixture(playerShape, 1);
    playerFixture.SetFriction(3);
    metaData[getPointer(playerFixture)] = {
        name: 'player'
    };

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }]
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.graphics = this.add.graphics();
    this.debugDrawer = new DebugDrawer(this.graphics, this.pixelsPerMeter);
    this.world.SetDebugDraw(this.debugDrawer.instance);

    this.rayCastCallback = new RayCastCallback(this.graphics,
        this.pixelsPerMeter, metaData);
}

function update() {
    if (!this.world) {
        return;
    }

    this.world.Step(0.016, 3, 2);

    const playerBodyPosition = playerBody.GetPosition();
    this.player.x = playerBodyPosition.x * this.pixelsPerMeter;
    this.player.y = playerBodyPosition.y * this.pixelsPerMeter - 3;

    const {
        b2Vec2
    } = box2d;

    // Left ray
    const leftRayBeginPoint = new b2Vec2(
        playerBodyPosition.x - 12 / this.pixelsPerMeter,
        playerBodyPosition.y + 5 / this.pixelsPerMeter);
    const leftRayEndPoint = new b2Vec2(
        playerBodyPosition.x - 12 / this.pixelsPerMeter,
        playerBodyPosition.y + 25 / this.pixelsPerMeter);
    this.world.RayCast(this.rayCastCallback.instance, leftRayBeginPoint, leftRayEndPoint);
    // Right ray
    const rightRayBeginPoint = new b2Vec2(
        playerBodyPosition.x + 12 / this.pixelsPerMeter,
        playerBodyPosition.y + 5 / this.pixelsPerMeter);
    const rightRayEndPoint = new b2Vec2(
        playerBodyPosition.x + 12 / this.pixelsPerMeter,
        playerBodyPosition.y + 25 / this.pixelsPerMeter);
    this.world.RayCast(this.rayCastCallback.instance, rightRayBeginPoint, rightRayEndPoint);

    if (showDebugInfo) {
        // Draw colliders
        this.world.DebugDraw();
        // Draw rays
        // Draw the left ray
        this.rayCastCallback.drawRay(leftRayBeginPoint, leftRayEndPoint, [1, 0, 0], 3);
        // Draw the right ray
        this.rayCastCallback.drawRay(rightRayBeginPoint, rightRayEndPoint, [1, 0, 0], 3);
    }

    if (showDebugInfo) {
        this.debugDrawer.clear();
        this.rayCastCallback.clear();
    }
}
