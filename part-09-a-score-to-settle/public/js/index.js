import Box2DLib from 'box2d-wasm';
import { Display, WEBGL, Scale, Game, Math as Math$1 } from 'phaser3';

let box2d = null;

function initBox2D(localhost = true) {
    return new Promise(resolve => {
        Box2DLib().then((re) => {
            box2d = re;
            resolve();
        });
    });
}

const entityCategory = {
    TOP_WALL: 0x0001,
    REST_WALLS: 0x0002,
    PLAYER: 0x0004,
    PLATFORMS: 0x0008,
    STARS: 0x0010,
    INACTIVE_STARS: 0x0020
};

class ContactListener {
    constructor(metaData, scoreText, initialNumberOfStars, starFixtures) {
        this.metaData = metaData;
        this.scoreText = scoreText;
        this.score = 0;
        this.initialNumberOfStars = initialNumberOfStars;
        this.starFixtures = starFixtures;
        this.collectedNumberOfStars = 0;

        const {
            b2_staticBody,
            b2Contact,
            b2Filter,
            b2Vec2,
            getPointer,
            JSContactListener,
            wrapPointer
        } = box2d;

        const self = this;
        this.instance = Object.assign(new JSContactListener(), {
            BeginContact(contact) {
                contact = wrapPointer(contact, b2Contact);

                const fixtureA = contact.GetFixtureA();
                const fixtureB = contact.GetFixtureB();

                const userDataA = self.metaData[getPointer(fixtureA)];
                const userDataB = self.metaData[getPointer(fixtureB)];

                if (!userDataA || !userDataB) {
                    return;
                }

                const nameA = userDataA.name;
                const nameB = userDataB.name;

                if ((nameA == "player" && nameB == "star") ||
                    (nameA == "star" && nameB == "player")) //
                {
                    let starBody, starFixture, starUserData;

                    if (nameA == "player" && nameB == "star") {
                        starFixture = fixtureB;
                        starBody = fixtureB.GetBody();
                        starUserData = userDataB;
                    } else if (nameA == "star" && nameB == "player") {
                        starFixture = fixtureA;
                        starBody = fixtureA.GetBody();
                        starUserData = userDataA;
                    }

                    starUserData.star.visible = false;

                    setTimeout(() => {
                        starFixture.SetSensor(true);
                        starBody.SetType(b2_staticBody);
                        starBody.SetTransform(new b2Vec2(starUserData.startPosX,
                            starUserData.startPosY), 0);
                        const filter = new b2Filter();
                        filter.categoryBits = entityCategory.INACTIVE_STARS;
                        starFixture.SetFilterData(filter);
                        self.score += 10;
                        self.scoreText.setText(`Score: ${self.score}`);
                    }, 0);
                }
            },
            EndContact(contact) {},
            PreSolve(contact) {},
            PostSolve(contact) {}
        });
    }
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

class RayCastCallback {
    constructor(graphics, pixelsPerMeter, callback) {
        this.graphics = graphics;
        this.pixelsPerMeter = pixelsPerMeter;
        this.callback = callback;

        const {
            b2Fixture,
            getPointer,
            JSRayCastCallback,
            wrapPointer
        } = box2d;

        const self = this;
        this.instance = Object.assign(new JSRayCastCallback(), {
            ReportFixture(fixture_p, point_p, normal_p, fraction) {
                self.callback(fixture_p, point_p, normal_p, fraction);
            }
        });
    }

    drawRay(from, to, color, lineWidth = 1) {
        const c = new Display.Color().setGLTo(color[0], color[1], color[2], 1);
        this.graphics.lineStyle(lineWidth, c.color, 1.0);
        this.graphics.beginPath();
        this.graphics.moveTo(from.x * this.pixelsPerMeter, from.y * this.pixelsPerMeter);
        this.graphics.lineTo(to.x * this.pixelsPerMeter, to.y * this.pixelsPerMeter);
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

let playerBody;
const metaData = {};

const stars = [];
const starBodies = [];
const starFixtures = [];

let groundedLeft = false;
let groundedRight = false;

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
        b2_dynamicBody,
        b2_staticBody,
        b2BodyDef,
        b2CircleShape,
        b2Filter,
        b2PolygonShape,
        b2Vec2,
        b2World,
        getPointer
    } = box2d;

    this.world = new b2World();
    const gravity = new b2Vec2(0, 10);
    this.world.SetGravity(gravity);
    this.pixelsPerMeter = 50;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.add.image(400, 300, 'sky');

    // Walls
    const walls = [];
    walls[0] = {
        x: 0,
        y: 300,
        w: 10,
        h: 600,
        xOffset: -5,
        yOffset: 0,
        category: entityCategory.REST_WALLS
    };
    walls[1] = {
        x: 800,
        y: 300,
        w: 10,
        h: 600,
        xOffset: 5,
        yOffset: 0,
        category: entityCategory.REST_WALLS
    };
    walls[2] = {
        x: 400,
        y: 0,
        w: 800,
        h: 10,
        xOffset: 0,
        yOffset: -5,
        category: entityCategory.TOP_WALL
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
        const filter = new b2Filter();
        filter.categoryBits = entityCategory.PLATFORMS;
        fixture.SetFilterData(filter);
    }

    // Stars
    let starX = 12;
    const stepX = 70;
    for (let i = 0; i < 12; i++) {
        stars[i] = this.add.image(starX, 0, 'star');
        const shape = new b2CircleShape();
        shape.m_radius = 10 / this.pixelsPerMeter;
        const bodyDef = new b2BodyDef();
        bodyDef.type = b2_dynamicBody;
        const startPosX = stars[i].x / this.pixelsPerMeter;
        const startPosY = stars[i].y / this.pixelsPerMeter;
        bodyDef.set_position(new b2Vec2(startPosX, startPosY));
        const body = this.world.CreateBody(bodyDef);
        body.SetFixedRotation(true);
        starBodies.push(body);
        const fixture = body.CreateFixture(shape, 1);
        fixture.SetRestitution(Math$1.FloatBetween(0.4, 0.8));
        metaData[getPointer(fixture)] = {
            name: 'star',
            startPosX: startPosX,
            startPosY: startPosY,
            star: stars[i]
        };
        const filter = new b2Filter();
        filter.categoryBits = entityCategory.STARS;
        filter.maskBits = entityCategory.PLATFORMS | entityCategory.PLAYER;
        fixture.SetFilterData(filter);
        starFixtures.push(fixture);
        starX += stepX;
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
    const filter = new b2Filter();
    filter.categoryBits = entityCategory.PLAYER;
    filter.maskBits = entityCategory.PLATFORMS |
        entityCategory.STARS | entityCategory.TOP_WALL |
        entityCategory.REST_WALLS;
    playerFixture.SetFilterData(filter);

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

    const scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#fff'
    });

    this.leftRayCastCallback = new RayCastCallback(this.graphics,
        this.pixelsPerMeter, leftRayCastHandler.bind(this));
    this.rightRayCastCallback = new RayCastCallback(this.graphics,
        this.pixelsPerMeter, rightRayCastHandler.bind(this));

    const contactListener = new ContactListener(metaData, scoreText, stars.length,
        starFixtures);
    this.world.SetContactListener(contactListener.instance);
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
    this.world.RayCast(this.leftRayCastCallback.instance,
        leftRayBeginPoint, leftRayEndPoint);
    // Right ray
    const rightRayBeginPoint = new b2Vec2(
        playerBodyPosition.x + 12 / this.pixelsPerMeter,
        playerBodyPosition.y + 5 / this.pixelsPerMeter);
    const rightRayEndPoint = new b2Vec2(
        playerBodyPosition.x + 12 / this.pixelsPerMeter,
        playerBodyPosition.y + 25 / this.pixelsPerMeter);
    this.world.RayCast(this.rightRayCastCallback.instance,
        rightRayBeginPoint, rightRayEndPoint);

    if (this.cursors.left.isDown) {
        const vel = playerBody.GetLinearVelocity();
        vel.x = -3;
        playerBody.SetLinearVelocity(vel);
        this.player.anims.play('left', true);
    } else if (this.cursors.right.isDown) {
        const vel = playerBody.GetLinearVelocity();
        vel.x = 3;
        playerBody.SetLinearVelocity(vel);
        this.player.anims.play('right', true);
    } else {
        this.player.anims.play('turn');
    }

    if (this.cursors.up.isDown && (groundedLeft || groundedRight)) {
        const vel = playerBody.GetLinearVelocity();
        vel.y = -9;
        playerBody.SetLinearVelocity(vel);
        groundedLeft = false;
        groundedRight = false;
    }

    for (let i = 0; i < starBodies.length; i++) {
        const starBodyPosition = starBodies[i].GetPosition();
        stars[i].x = starBodyPosition.x * this.pixelsPerMeter;
        stars[i].y = starBodyPosition.y * this.pixelsPerMeter;
    }

    if (showDebugInfo) {
        // Draw colliders
        this.world.DebugDraw();
        // Draw rays
        // Draw the left ray
        this.leftRayCastCallback.drawRay(leftRayBeginPoint, leftRayEndPoint, [1, 0, 0], 3);
        // Draw the right ray
        this.rightRayCastCallback.drawRay(rightRayBeginPoint, rightRayEndPoint, [1, 0, 0], 3);
    }

    if (showDebugInfo) {
        this.debugDrawer.clear();
    }
}

function leftRayCastHandler(fixture_p, point_p, normal_p, fraction) {
    const {
        b2Fixture,
        getPointer,
        wrapPointer
    } = box2d;

    const fixture = wrapPointer(fixture_p, b2Fixture);
    const name = metaData[getPointer(fixture)].name;

    if (name === 'platform') {
        groundedLeft = true;
    }
}

function rightRayCastHandler(fixture_p, point_p, normal_p, fraction) {
    const {
        b2Fixture,
        getPointer,
        wrapPointer
    } = box2d;

    const fixture = wrapPointer(fixture_p, b2Fixture);
    const name = metaData[getPointer(fixture)].name;

    if (name === 'platform') {
        groundedRight = true;
    }
}
//# sourceMappingURL=index.js.map
