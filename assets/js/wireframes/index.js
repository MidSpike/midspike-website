//------------------------------------------------------------//
//        Copyright (c) MidSpike, All rights reserved.        //
//------------------------------------------------------------//

'use strict';

//------------------------------------------------------------//

/**
 * Used as a pseudo-sleep function.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamps a value between a minimum and maximum value.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

/**
 * Generates a random number between a minimum and maximum value.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomFromInclusiveRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//------------------------------------------------------------//

/**
 * @typedef {{ x: number, y: number }} TwoDimensionalCoordinate
 */

/**
 * Finds the coordinate located between two coordinates at a given delta.
 * @param {TwoDimensionalCoordinate} pointA
 * @param {TwoDimensionalCoordinate} pointB
 * @param {number} delta
 * @returns {TwoDimensionalCoordinate}
 */
function lerpPoint({ x: x1, y: y1 }, { x: x2, y: y2 }, delta) {
    const inverseDelta = 1 - delta;

    return {
        x: (inverseDelta * x1) + (delta * x2),
        y: (inverseDelta * y1) + (delta * y2),
    };
}

/**
 * Locates a coordinate on a quadratic bezier curve at a given delta.
 * @param {TwoDimensionalCoordinate} start
 * @param {TwoDimensionalCoordinate} interruption
 * @param {TwoDimensionalCoordinate} stop
 * @param {number} delta
 * @returns {TwoDimensionalCoordinate}
 */
function quadraticBezier(start, interruption, stop, delta) {
    const firstPoint = lerpPoint(start, interruption, delta);
    const secondPoint = lerpPoint(interruption, stop, delta);

    return lerpPoint(firstPoint, secondPoint, delta);
}

/**
 * Locates a coordinate on a multi quadratic bezier curve at a given delta.
 * @param {TwoDimensionalCoordinate} start
 * @param {TwoDimensionalCoordinate[]} interruptions
 * @param {TwoDimensionalCoordinate} stop
 * @param {number} delta
 * @returns {TwoDimensionalCoordinate}
 */
function multiBezier(start, interruptions, stop, delta) {
    let transitoryCoordinate = start;

    for (const interruption of interruptions) {
        transitoryCoordinate = quadraticBezier(transitoryCoordinate, interruption, stop, delta);
    }

    return transitoryCoordinate;
}

//------------------------------------------------------------//

/**
 * @typedef {{
 *  a: TwoDimensionalCoordinate,
 *  b: TwoDimensionalCoordinate,
 *  width: number,
 *  height: number,
 * }} RelativeBindingBox
 */

/**
 * 
 * @param {TwoDimensionalCoordinate} centerPoint
 * @param {HTMLCanvasElement} canvas
 * @param {number} apothem the distance from the center point to the edge of the box
 * @returns {RelativeBindingBox}
 */
function relativeBindingBox({ x: centerPointX, y: centerPointY }, canvas, apothem) {
    const minimumPoint = {
        x: clamp(centerPointX - apothem, 0, canvas.width),
        y: clamp(centerPointY - apothem, 0, canvas.height),
    };

    const maximumPoint = {
        x: clamp(centerPointX + apothem, 0, canvas.width),
        y: clamp(centerPointY + apothem, 0, canvas.height),
    };

    return {
        a: minimumPoint,
        b: maximumPoint,
        width: maximumPoint.x - minimumPoint.x,
        height: maximumPoint.y - minimumPoint.y,
    };
}

//------------------------------------------------------------//

class Point {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {number} x
     * @param {number} y
     * @param {string} color
     */
    constructor(canvas, x, y, color) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.initialLocation = { x, y };
        this.currentLocation = { x, y };
        this.desiredLocation = { x, y };
        this.desiredBezierPoints = [];
        this.locationDelta = 0;
        this.locationDeltaLimit = 60; // number of frames to travel to the next location
        this.color = color;
        this.debugColor = '#00aaff';
        this.debugLineWidth = 4;
        this.debugVisualsEnabled = false;
    }

    /**
     * @param {boolean} state
     */
    toggleDebugVisuals(state) {
        this.debugVisualsEnabled = state ?? !this.debugVisualsEnabled;
    }

    draw() {
        if (this.locationDelta >= this.locationDeltaLimit) {
            this.initialLocation = this.currentLocation;
            this.locationDelta = 0;

            const travelDistance = randomFromInclusiveRange(100, 500);
            const travelBox = relativeBindingBox(this.currentLocation, this.canvas, travelDistance);

            this.desiredLocation = {
                x: clamp(Math.random() * travelBox.width + travelBox.a.x, 0, this.canvas.width),
                y: clamp(Math.random() * travelBox.height + travelBox.a.y, 0, this.canvas.height),
            };

            this.desiredBezierPoints = [];
            for (let i = 0; i < randomFromInclusiveRange(1, 5); i++) {
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
                this.context.lineWidth = this.debugLineWidth;
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
            for (let i = 0; i <= this.locationDeltaLimit; i += 1) {
                const newLocation = multiBezier(this.initialLocation, this.desiredBezierPoints, this.desiredLocation, i / this.locationDeltaLimit);

                this.context.beginPath();
                this.context.strokeStyle = this.debugColor;
                this.context.lineWidth = this.debugLineWidth;
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

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {string} color
     * @param {number} renderDistance
     */
    constructor(canvas, color, renderDistance) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        this.color = color;
        this.renderDistance = renderDistance;
    }

    /**
     * @param {Point} point
     */
    addPoint(point) {
        this.points.push(point);
    }

    /**
     * @param {number} numPoints
     */
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

/**
 * @param {HTMLCanvasElement} canvas
 */
function resizeCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/**
 * @param {HTMLElement} parent
 */
function createCanvas(parent) {
    const canvas = document.createElement('canvas');

    canvas.classList.add('wireframe-canvas');

    parent.appendChild(canvas);

    return canvas;
}

/**
 * @param {HTMLElement} parent
 */
export async function startWireframes(parent) {
    const canvas = createCanvas(parent);
    resizeCanvas(canvas);

    const wireFrame = new WireFrame(canvas, '#ff5500', 100);
    wireFrame.draw();

    window.addEventListener('resize', () => {
        resizeCanvas(canvas);
    });

    window.addEventListener('pointerdown', (event) => {
        event.preventDefault();

        const canvasBox = canvas.getBoundingClientRect();

        const pointerPosition = {
            x: event.touches?.[0]?.clientX ?? event.clientX,
            y: event.touches?.[0]?.clientY ?? event.clientY,
        };

        const pointerPositionRelativeToCanvas = {
            x: pointerPosition.x - canvasBox.x,
            y: pointerPosition.y - canvasBox.y,
        };

        const pointX = pointerPositionRelativeToCanvas.x * canvas.width / canvasBox.width;
        const pointY = pointerPositionRelativeToCanvas.y * canvas.height / canvasBox.height;

        const point = new Point(canvas, pointX, pointY, '#ff5500');
        point.toggleDebugVisuals(true);

        wireFrame.addPoint(point);
    });

    for (let i = 1; i <= 10; i++) {
        wireFrame.addPoints(i);
        await delay(5_000);
    }
}
