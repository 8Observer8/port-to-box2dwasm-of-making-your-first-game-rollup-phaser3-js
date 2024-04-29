import { box2d } from './init-box2d.js';
import { entityCategory } from './entity-category.js';

export default class ContactListener {
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
