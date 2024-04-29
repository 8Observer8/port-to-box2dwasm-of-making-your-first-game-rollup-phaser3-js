import { box2d } from './init-box2d.js';
import { entityCategory } from './entity-category.js';
import { Math } from "phaser3";

export default class ContactListener {
    constructor(metaData, scoreText, initialNumberOfStars, starFixtures,
        bombFixtures, player, scene, pixelsPerMeter, world) //
    {
        this.metaData = metaData;
        this.scoreText = scoreText;
        this.score = 0;
        this.initialNumberOfStars = initialNumberOfStars;
        this.starFixtures = starFixtures;
        this.collectedNumberOfStars = 0;
        this.bombFixtures = bombFixtures;
        this.player = player;
        this.scene = scene;
        this.pixelsPerMeter = pixelsPerMeter;
        this.world = world;
        this.paused = false;

        const {
            b2_dynamicBody,
            b2_staticBody,
            b2BodyDef,
            b2Contact,
            b2CircleShape,
            b2Filter,
            b2FixtureDef,
            b2Vec2,
            b2WorldManifold,
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
                        self.collectedNumberOfStars++;

                        if (self.collectedNumberOfStars == self.initialNumberOfStars) {
                            self.collectedNumberOfStars = 0;
                            for (let i = 0; i < self.starFixtures.length; i++) {
                                self.starFixtures[i].SetSensor(false);
                                self.starFixtures[i].GetBody().SetType(b2_dynamicBody);
                                const filter = new b2Filter();
                                filter.categoryBits = entityCategory.STARS;
                                self.starFixtures[i].SetFilterData(filter);
                                const starUserData = self.metaData[getPointer(self.starFixtures[i])];
                                starUserData.star.visible = true;
                            }

                            const x = (self.player.x < 400) ? Math.Between(400, 800) : Math.Between(0, 400);
                            const bomb = self.scene.add.sprite(x, 20, 'bomb');
                            const bombShape = new b2CircleShape();
                            bombShape.m_radius = 7 / self.pixelsPerMeter;
                            const bombBodyDef = new b2BodyDef();
                            bombBodyDef.type = b2_dynamicBody;
                            const bombPosX = bomb.x / self.pixelsPerMeter;
                            const bombPosY = bomb.y / self.pixelsPerMeter;
                            bombBodyDef.set_position(new b2Vec2(bombPosX, bombPosY));
                            const bombBody = self.world.CreateBody(bombBodyDef);
                            bombBody.SetFixedRotation(true);
                            // bombBody.SetGravityScale(0);
                            bombBody.SetLinearVelocity(new b2Vec2(Math.Between(-3, 3), 2));
                            const bombFixtureDef = new b2FixtureDef();
                            const bombFixture = bombBody.CreateFixture(bombShape, 1);
                            bombFixture.SetFriction(0);
                            bombFixture.SetRestitution(1);
                            metaData[getPointer(bombFixture)] = {
                                name: 'bomb',
                                bomb: bomb
                            };
                            const filter = new b2Filter();
                            filter.categoryBits = entityCategory.BOMBS;
                            filter.maskBits = entityCategory.PLATFORMS |
                                entityCategory.TOP_WALL | entityCategory.REST_WALLS |
                                entityCategory.PLAYER;
                            bombFixture.SetFilterData(filter);
                            self.bombFixtures.push(bombFixture);
                        }
                    }, 0);
                }

                if ((nameA == 'bomb' && nameB == 'platform') ||
                    (nameA == 'platform' && nameB == 'bomb') ||
                    (nameA == 'bomb' && nameB == 'wall') ||
                    (nameA == 'wall' && nameB == 'bomb')) //
                {
                    let bombBody;
                    if (nameA == 'bomb') {
                        bombBody = fixtureA.GetBody();
                    } else {
                        bombBody = fixtureB.GetBody();
                    }
                    const vel = bombBody.GetLinearVelocity();
                    const m = new b2WorldManifold();
                    contact.GetWorldManifold(m);
                    const x = window.Math.round(m.normal.x);
                    const y = window.Math.round(m.normal.y);
                    if ((x == 1 && y == 0) || x == -1 && y == 0) {
                        vel.x = -vel.x;
                        bombBody.SetLinearVelocity(vel);
                    } else if ((x == 0 && y == 1) || (x == 0 && y == -1)) {
                        vel.y = -vel.y;
                        bombBody.SetLinearVelocity(vel);
                    }
                }

                if ((nameA == 'player' && nameB == 'bomb') ||
                    (nameA == 'bomb' && nameB == 'player')) //
                {
                    self.player.setTint(0xff0000);
                    self.player.anims.play('turn');
                    self.paused = true;
                }
            },
            EndContact(contact) {},
            PreSolve(contact) {},
            PostSolve(contact) {}
        });
    }

    isPaused() {
        return this.paused;
    }
}
