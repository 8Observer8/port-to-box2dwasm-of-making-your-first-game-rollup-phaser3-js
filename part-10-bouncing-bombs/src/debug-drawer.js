import { Display } from "phaser3";
import { box2d } from "./init-box2d.js";

const sizeOfB2Vec2 = Float32Array.BYTES_PER_ELEMENT * 2;

export default class DebugDrawer {
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
