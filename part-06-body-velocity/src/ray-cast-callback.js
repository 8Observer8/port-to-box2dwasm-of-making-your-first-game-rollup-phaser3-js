import { box2d } from './init-box2d.js';
import { Display } from 'phaser3';

export default class RayCastCallback {
    constructor(graphics, pixelsPerMeter, metaData) {
        this.graphics = graphics;
        this.pixelsPerMeter = pixelsPerMeter;
        this.metaData = metaData;

        const {
            b2Fixture,
            getPointer,
            JSRayCastCallback,
            wrapPointer
        } = box2d;

        const self = this;
        this.instance = Object.assign(new JSRayCastCallback(), {
            ReportFixture(fixture_p, point_p, normal_p, fraction) {
                const fixture = wrapPointer(fixture_p, b2Fixture);
                const name = self.metaData[getPointer(fixture)].name;
                // console.log(name);
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
