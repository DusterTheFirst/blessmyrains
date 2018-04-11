window.addEventListener("load", () => {
    let storm = new Storm();
});
class Storm {
    constructor(speed = 1, color = { r: 80, g: 175, b: 255, a: 0.5 }) {
        this.started = false;
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.dpr = window.devicePixelRatio || 1;
        this.drop_time = 0;
        this.drop_delay = 25;
        this.wind = 4;
        this.rain = [];
        this.speed = speed;
        this.color = color;
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.rain_color = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
        this.rain_color_clear = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`;
        window.addEventListener("resize", () => this.resize());
        this.resize();
        Ticker.addListener((x, y) => this.step(x, y));
        document.addEventListener("mousemove", (evt) => this.mouseHandler(evt));
        document.addEventListener("touchstart", (evt) => this.touchHandler(evt));
        document.addEventListener("touchmove", (evt) => this.touchHandler(evt));
    }
    mouseHandler(evt) {
        this.updateCursor(evt.clientX, evt.clientY);
    }
    touchHandler(evt) {
        evt.preventDefault();
        let touch = evt.touches[0];
        this.updateCursor(touch.clientX, touch.clientY);
    }
    updateCursor(x, y) {
        x /= this.width;
        y /= this.height;
        let y_inverse = (1 - y);
        this.drop_delay = y_inverse * y_inverse * y_inverse * 100 + 2;
        this.wind = (x - 0.5) * 50;
    }
    resize() {
        this.rain = [];
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
    }
    step(time, lag) {
        let multiplier = this.speed * lag;
        this.drop_time += time * this.speed;
        while (this.drop_time > this.drop_delay) {
            this.drop_time -= this.drop_delay;
            let new_rain = new Rain(this);
            let wind_expand = Math.abs(this.height / new_rain.speed * this.wind);
            let spawn_x = Math.random() * (this.width + wind_expand);
            if (this.wind > 0)
                spawn_x -= wind_expand;
            new_rain.x = spawn_x;
            this.rain.push(new_rain);
        }
        for (let i = this.rain.length - 1; i >= 0; i--) {
            let r = this.rain[i];
            r.y += r.speed * r.z * multiplier;
            r.x += r.z * this.wind * multiplier;
            if (r.y > this.height + Rain.height * r.z || (this.wind < 0 && r.x < this.wind) || (this.wind > 0 && r.x > this.width + this.wind)) {
                this.rain.splice(i, 1);
            }
        }
        this.draw();
    }
    draw() {
        this.ctx.clearRect(0, 0, this.width * this.dpr, this.height * this.dpr);
        this.ctx.beginPath();
        let rain_height = Rain.height * this.dpr;
        for (let i = this.rain.length - 1; i >= 0; i--) {
            let r = this.rain[i];
            let real_x = r.x * this.dpr;
            let real_y = r.y * this.dpr;
            this.ctx.moveTo(real_x, real_y);
            this.ctx.lineTo(real_x - this.wind * r.z * this.dpr * 1.5, real_y - rain_height * r.z);
        }
        this.ctx.lineWidth = Rain.width * this.dpr;
        this.ctx.strokeStyle = this.rain_color;
        this.ctx.stroke();
    }
}
class Rain {
    constructor(storm) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.speed = 25;
        this.storm = storm;
        this.y = Math.random() * -100;
        this.z = Math.random() * 0.5 + 0.5;
    }
}
Rain.width = 2;
Rain.height = 40;
var Ticker;
(function (Ticker) {
    function addListener(fn) {
        if (typeof fn !== "function")
            throw new Error(("Ticker.addListener() requires a function reference passed in."));
        listeners.push(fn);
        if (!started) {
            started = true;
            queueFrame();
        }
    }
    Ticker.addListener = addListener;
    let started = false;
    let last_timestamp = 0;
    let listeners = [];
    function queueFrame() {
        if (window.requestAnimationFrame) {
            requestAnimationFrame(frameHandler);
        }
        else {
            webkitRequestAnimationFrame(frameHandler);
        }
    }
    function frameHandler(timestamp) {
        let frame_time = timestamp - last_timestamp;
        last_timestamp = timestamp;
        if (frame_time < 0) {
            frame_time = 17;
        }
        else if (frame_time > 68) {
            frame_time = 68;
        }
        for (let i = 0, len = listeners.length; i < len; i++) {
            listeners[i].call(window, frame_time, frame_time / 16.67);
        }
        queueFrame();
    }
})(Ticker || (Ticker = {}));
