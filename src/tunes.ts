window.addEventListener("load", async () => {
    let audio = new Audio("/src/tunes.mp3");

    let time = parseInt(window.localStorage.getItem("audio"));


    audio.currentTime = time;
    await audio.play();

    audio.loop = true;

    audio.addEventListener("timeupdate", (evt) => {
        window.localStorage.setItem("audio", audio.currentTime.toString());

        let bar = document.querySelector<HTMLDivElement>(".progress .bar");

        bar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    });
});