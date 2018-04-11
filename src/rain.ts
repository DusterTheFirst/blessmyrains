// initialize
window.addEventListener("load", () => {
    let storm = new Storm();
});


interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

class Storm {
    /** - physics speed multiplier: allows slowing down or speeding up simulation */
    speed: number;
    /** - color of particles */
    color: RGBA;

    /** whether demo is running */
    started: boolean = false;
    /** canvas and associated context references */
    canvas: HTMLCanvasElement = null;
    ctx: CanvasRenderingContext2D = null;
    /** viewport dimensions (DIPs) */
    width: number = 0;
    /** viewport dimensions (DIPs) */
    height: number = 0;
    /** devicePixelRatio alias (should only be used for rendering, physics shouldn't care) */
    dpr: number = window.devicePixelRatio || 1;
    /** time since last drop */
    drop_time: number = 0;
    /** ideal time between drops (changed with mouse/finger) */
    drop_delay: number = 25;
    /** wind applied to rain (changed with mouse/finger) */
    wind: number = 4;
    /** color of rain (set in init) */
    rain_color: string;
    rain_color_clear: string;

    /** rain particles */
    rain: Rain[] = [];

    constructor(speed = 1, color: RGBA = { r: 80, g: 175, b: 255, a: 0.5 }) {
        this.speed = speed;
        this.color = color;

        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d");

        this.rain_color = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
        this.rain_color_clear = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`;

        window.addEventListener("resize", () => this.resize());
        this.resize();

        Ticker.addListener((x, y) => this.step(x, y));

        document.addEventListener("mousemove", (evt) => this.mouseHandler(evt));
        document.addEventListener("touchstart", (evt) => this.touchHandler(evt as any));
        document.addEventListener("touchmove", (evt) => this.touchHandler(evt as any));
    }

    private mouseHandler(evt: MouseEvent) {
        this.updateCursor(evt.clientX, evt.clientY);
    }
    private touchHandler(evt: TouchEvent) {
        evt.preventDefault();
        let touch = evt.touches[0];
        this.updateCursor(touch.clientX, touch.clientY);
    }
    private updateCursor(x: number, y: number) {
        x /= this.width;
        y /= this.height;
        let y_inverse = (1 - y);

        this.drop_delay = y_inverse * y_inverse * y_inverse * 100 + 2;
        this.wind = (x - 0.5) * 50;
    }

    /** Resize the canvas */
    resize() {
        this.rain = [];

        // resize
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
    }

    step(time: number, lag: number) {
        // multiplier for physics
        let multiplier = this.speed * lag;

        // spawn drops
        this.drop_time += time * this.speed;

        while (this.drop_time > this.drop_delay) {
            this.drop_time -= this.drop_delay;

            let new_rain = new Rain(this);

            let wind_expand = Math.abs(this.height / new_rain.speed * this.wind); // expand spawn width as wind increases

            let spawn_x = Math.random() * (this.width + wind_expand);
            if (this.wind > 0) spawn_x -= wind_expand;
            new_rain.x = spawn_x;

            this.rain.push(new_rain);
        }

        // rain physics
        for (let i = this.rain.length - 1; i >= 0; i--) {
            let r = this.rain[i];
            r.y += r.speed * r.z * multiplier;
            r.x += r.z * this.wind * multiplier;
            // remove rain when out of view
            // recycle rain
            if (r.y > this.height + Rain.height * r.z || (this.wind < 0 && r.x < this.wind) || (this.wind > 0 && r.x > this.width + this.wind)) {
                this.rain.splice(i, 1);
            }
        }

        this.draw();
    }

    draw() {
        // start fresh
        this.ctx.clearRect(0, 0, this.width * this.dpr, this.height * this.dpr);

        // draw rain (trace all paths first, then stroke once)
        this.ctx.beginPath();
        let rain_height = Rain.height * this.dpr;
        for (let i = this.rain.length - 1; i >= 0; i--) {
            let r = this.rain[i];
            let real_x = r.x * this.dpr;
            let real_y = r.y * this.dpr;
            this.ctx.moveTo(real_x, real_y);
            // magic number 1.5 compensates for lack of trig in drawing angled rain
            this.ctx.lineTo(real_x - this.wind * r.z * this.dpr * 1.5, real_y - rain_height * r.z);
        }
        this.ctx.lineWidth = Rain.width * this.dpr;
        this.ctx.strokeStyle = this.rain_color;
        this.ctx.stroke();
    }
}

class Rain {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;

    public speed: number = 25;

    public static width = 2;
    public static height = 40;

    private readonly storm: Storm;

    constructor(storm: Storm) {
        this.storm = storm;
        this.y = Math.random() * -100;
        this.z = Math.random() * 0.5 + 0.5;
    }
}

type TickerListener = (time: number, lag: number) => void;
namespace Ticker {
    export function addListener(fn: TickerListener) {
        if (typeof fn !== "function")
            throw new Error(("Ticker.addListener() requires a function reference passed in."));

        listeners.push(fn);

        // start frame-loop lazily
        if (!started) {
            started = true;
            queueFrame();
        }
    }

    // private
    let started: boolean = false;
    let last_timestamp: number = 0;
    let listeners: TickerListener[] = [];

    // queue up a new frame (calls frameHandler)
    function queueFrame() {
        if (window.requestAnimationFrame) {
            requestAnimationFrame(frameHandler);
        } else {
            webkitRequestAnimationFrame(frameHandler);
        }
    }
    function frameHandler(timestamp: number) {
        let frame_time = timestamp - last_timestamp;
        last_timestamp = timestamp;
        // make sure negative time isn't reported (first frame can be whacky)
        if (frame_time < 0) {
            frame_time = 17;
        }
        // - cap minimum framerate to 15fps[~68ms] (assuming 60fps[~17ms] as 'normal')
        else if (frame_time > 68) {
            frame_time = 68;
        }

        // fire custom listeners
        for (let i = 0, len = listeners.length; i < len; i++) {
            listeners[i].call(window, frame_time, frame_time / 16.67);
        }

        // always queue another frame
        queueFrame();
    }
}