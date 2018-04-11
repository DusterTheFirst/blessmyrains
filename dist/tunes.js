var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
window.addEventListener("load", () => __awaiter(this, void 0, void 0, function* () {
    let audio = new Audio("/src/tunes.mp3");
    let time = parseInt(window.localStorage.getItem("audio")) | 0;
    audio.currentTime = time;
    yield audio.play();
    audio.loop = true;
    audio.addEventListener("timeupdate", (evt) => {
        window.localStorage.setItem("audio", audio.currentTime.toString());
        let bar = document.querySelector(".progress .bar");
        bar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    });
}));
