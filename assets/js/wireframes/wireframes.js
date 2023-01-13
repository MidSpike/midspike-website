//------------------------------------------------------------//
//        Copyright (c) MidSpike, All rights reserved.        //
//------------------------------------------------------------//

'use strict';

//------------------------------------------------------------//

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

function randomFromInclusiveRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//------------------------------------------------------------//

function lerpPoint({ x: x1, y: y1 }, { x: x2, y: y2 }, delta) {
    const inverseDelta = 1 - delta;

    return {
        x: (inverseDelta * x1) + (delta * x2),
        y: (inverseDelta * y1) + (delta * y2),
    };
}

function quadraticBezier(start, interruption, stop, delta) {
    const firstPoint = lerpPoint(start, interruption, delta);
    const secondPoint = lerpPoint(interruption, stop, delta);

    return lerpPoint(firstPoint, secondPoint, delta);
}

function multiBezier(start, points, stop, delta) {
    let transitoryPoint = start;

    for (const point of points) {
        transitoryPoint = quadraticBezier(transitoryPoint, point, stop, delta);
    }

    return transitoryPoint;
}

//------------------------------------------------------------//

function relativeBindingBox({ x: pointX, y: pointY }, canvas, size) {
    const pointA = {
        x: clamp(pointX - size, 0, canvas.width),
        y: clamp(pointY - size, 0, canvas.height),
    };

    const pointB = {
        x: clamp(pointX + size, 0, canvas.width),
        y: clamp(pointY + size, 0, canvas.height),
    };

    return {
        a: pointA,
        b: pointB,
        width: pointB.x - pointA.x,
        height: pointB.y - pointA.y,
    };
}

//------------------------------------------------------------//

class Point {
    constructor(canvas, x, y, color) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.initialLocation = { x, y };
        this.currentLocation = { x, y };
        this.desiredLocation = { x, y };
        this.desiredBezierPoints = [];
        this.locationDelta = 0;
        this.locationDeltaLimit = 60; // number of frames required
        this.color = color;
        this.debugColor = '#00aaff';
        this.debugVisualsEnabled = false;
    }

    toggleDebugVisuals(state) {
        this.debugVisualsEnabled = state ?? !this.debugVisualsEnabled;
    }

    draw() {
        if (this.locationDelta >= this.locationDeltaLimit) {
            this.initialLocation = this.currentLocation;
            this.locationDelta = 0;

            const travelDistance = randomFromInclusiveRange(50, 500);
            const travelBox = relativeBindingBox(this.currentLocation, this.canvas, travelDistance);

            this.desiredLocation = {
                x: clamp(Math.random() * travelBox.width + travelBox.a.x, 0, this.canvas.width),
                y: clamp(Math.random() * travelBox.height + travelBox.a.y, 0, this.canvas.height),
            };

            this.desiredBezierPoints = [];
            for (let i = 0; i < randomFromInclusiveRange(1, 3); i++) {
                this.desiredBezierPoints.push({
                    x: clamp(Math.random() * travelBox.width + travelBox.a.x, 0, this.canvas.width),
                    y: clamp(Math.random() * travelBox.height + travelBox.a.y, 0, this.canvas.height),
                });
            }
        }

        // move to the next location
        this.locationDelta += 1;
        this.currentLocation = multiBezier(this.initialLocation, this.desiredBezierPoints, this.desiredLocation, this.locationDelta / this.locationDeltaLimit);

        // debugging visuals
        if (this.debugVisualsEnabled) {
            const locationsToTravel = [
                ...this.desiredBezierPoints,
                this.desiredLocation,
            ];
            let previousLocationToTravel = this.initialLocation;
            for (const locationToTravel of locationsToTravel) {
                // draw line
                this.context.beginPath();
                this.context.strokeStyle = '#ffffff';
                this.context.lineWidth = 5;
                this.context.moveTo(previousLocationToTravel.x, previousLocationToTravel.y);
                this.context.lineTo(locationToTravel.x, locationToTravel.y);
                this.context.closePath();
                this.context.stroke();

                // draw dot
                this.context.beginPath();
                this.context.arc(locationToTravel.x, locationToTravel.y, 5, 0, 2 * Math.PI);
                this.context.fillStyle = '#ffffff';
                this.context.closePath();
                this.context.fill();

                previousLocationToTravel = locationToTravel;
            }

            // initial location dot
            this.context.beginPath();
            this.context.arc(this.initialLocation.x, this.initialLocation.y, 5, 0, 2 * Math.PI);
            this.context.fillStyle = this.debugColor;
            this.context.closePath();
            this.context.fill();

            // desired location dot
            this.context.beginPath();
            this.context.arc(this.desiredLocation.x, this.desiredLocation.y, 5, 0, 2 * Math.PI);
            this.context.fillStyle = this.debugColor;
            this.context.closePath();
            this.context.fill();

            // draw path line
            let lastLocation = this.initialLocation;
            for (let i = 0; i < this.locationDeltaLimit; i += 1) {
                const newLocation = multiBezier(this.initialLocation, this.desiredBezierPoints, this.desiredLocation, i / this.locationDeltaLimit);

                this.context.beginPath();
                this.context.strokeStyle = this.debugColor;
                this.context.lineWidth = 5;
                this.context.moveTo(lastLocation.x, lastLocation.y);
                this.context.lineTo(newLocation.x, newLocation.y);
                this.context.closePath();
                this.context.stroke();

                lastLocation = newLocation;
            }

            // current location dot
            this.context.beginPath();
            this.context.arc(this.currentLocation.x, this.currentLocation.y, 10, 0, 2 * Math.PI);
            this.context.fillStyle = this.debugColor;
            this.context.closePath();
            this.context.fill();
        } else {
            // current location dot
            this.context.beginPath();
            this.context.arc(this.currentLocation.x, this.currentLocation.y, 5, 0, 2 * Math.PI);
            this.context.fillStyle = this.color;
            this.context.closePath();
            this.context.fill();
        }
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
                if (otherPoint === point) continue;

                const distanceBetween = Math.sqrt(Math.pow(point.currentLocation.x - otherPoint.currentLocation.x, 2) + Math.pow(point.currentLocation.y - otherPoint.currentLocation.y, 2));
                if (distanceBetween < this.renderDistance) {
                    if (closePoints.length > 5) continue;

                    closePoints.push(otherPoint);
                }
            }

            for (const closePoint of closePoints) {
                this.context.beginPath();
                this.context.strokeStyle = this.color;
                this.context.lineWidth = 1;
                this.context.moveTo(point.currentLocation.x, point.currentLocation.y);
                this.context.lineTo(closePoint.currentLocation.x, closePoint.currentLocation.y);
                this.context.stroke();
            }

            point.draw();
        }

        requestAnimationFrame(() => this.draw());
    }
}

//------------------------------------------------------------//

function resizeCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createCanvas(parent) {
    const canvas = document.createElement('canvas');

    canvas.classList.add('wireframe-canvas');

    parent.appendChild(canvas);

    return canvas;
}

async function main() {
    const mainBox = document.querySelector('#main');
    if (!mainBox) throw new Error('Unable to locate #main');

    const canvas = createCanvas(mainBox);
    resizeCanvas(canvas);

    const wireFrame = new WireFrame(canvas, '#ff5500', 100);
    wireFrame.draw();

    window.addEventListener('resize', () => {
        resizeCanvas(canvas);
    });

    window.addEventListener('click', (event) => {
        const canvasBox = canvas.getBoundingClientRect();

        const x = event.clientX * canvas.width / canvasBox.width;
        const y = event.clientY * canvas.height / canvasBox.height;

        const point = new Point(canvas, x, y, '#ff5500');
        point.toggleDebugVisuals(true);

        wireFrame.addPoint(point);
    });

    for (let i = 1; i <= 10; i++) {
        wireFrame.addPoints(i);
        await delay(5_000);
    }
}

main();
