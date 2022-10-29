//------------------------------------------------------------//
//        Copyright (c) MidSpike, All rights reserved.        //
//------------------------------------------------------------//

'use strict';

//------------------------------------------------------------//

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

//------------------------------------------------------------//

class Point {
    constructor(canvas, x, y, color) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.location = { x, y };
        this.desiredLocation = { x, y };
        this.color = color;
    }

    draw() {
        const distanceBetween = Math.sqrt(Math.pow(this.desiredLocation.x - this.location.x, 2) + Math.pow(this.desiredLocation.y - this.location.y, 2));
            
        if (distanceBetween < 1) {
            this.desiredLocation = {
                x: clamp(Math.random() * this.canvas.width, 0, this.canvas.width),
                y: clamp(Math.random() * this.canvas.height, 0, this.canvas.height),
            };
        }

        this.location.x += Math.sign(this.desiredLocation.x - this.location.x);
        this.location.y += Math.sign(this.desiredLocation.y - this.location.y);

        this.context.beginPath();
        this.context.arc(this.location.x, this.location.y, 2.5, 0, 2 * Math.PI);
        this.context.fillStyle = this.color;
        this.context.fill();
    }

}

class WireFrame {
    points = [];

    constructor(canvas, color, renderDistance) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        this.color = color;
        this.renderDistance = renderDistance;
    }

    addPoint(point) {
        this.points.push(point);
    }

    addPoints(numPoints) {
        for (let i = 0; i < numPoints; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const point = new Point(this.canvas, x, y, this.color);
            this.points.push(point);
        }
    }

    draw() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.strokeStyle = this.color;

        for (const point of this.points) {
            const closePoints = [];
            for (const otherPoint of this.points) {
                if (otherPoint === point) {
                    continue;
                }

                const distanceBetween = Math.sqrt(Math.pow(point.location.x - otherPoint.location.x, 2) + Math.pow(point.location.y - otherPoint.location.y, 2));
                if (distanceBetween < this.renderDistance) {
                    if (closePoints.length > 5) continue;

                    closePoints.push(otherPoint);
                }
            }

            for (const closePoint of closePoints) {
                this.context.beginPath();
                this.context.moveTo(point.location.x, point.location.y);
                this.context.lineTo(closePoint.location.x, closePoint.location.y);
                this.context.stroke();
            }

            point.draw();
        }

        requestAnimationFrame(() => this.draw());
    }
}

//------------------------------------------------------------//

const mainBox = document.querySelector('#main');
if (!mainBox) throw new Error('Unable to locate #main');

const canvas = document.createElement('canvas');
canvas.classList.add('wireframe-canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
mainBox.appendChild(canvas);

const wireFrame = new WireFrame(canvas, '#ff5500', 500);
wireFrame.addPoints(100);
wireFrame.draw();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

window.addEventListener('click', (event) => {
    const mousePosition = {
        x: event.clientX,
        y: event.clientY,
    };

    const point = new Point(canvas, mousePosition.x, mousePosition.y, '#ff5500');

    wireFrame.addPoint(point);
});
