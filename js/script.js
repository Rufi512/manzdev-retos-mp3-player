let tracks = []
let trackPosition = 0
let isPlaying = false
let isTouching = false
let touchOrigin
let lastPositionTouchScreen
let audio = new Audio()
//audio.crossOrigin = "anonymous"
const container = document.querySelector('.mp3-player')
const volumeBar = document.querySelector(".volume-bar")
const volumeIndicator = document.getElementById("volume-indicator")
const currentIndicator = document.getElementById("current-indicator")
const lineIndicator = document.getElementById("indicator-show")
const audioLengthIndicator = document.getElementById("audio-length")
const currentTimeText = document.getElementById("current-time")
const nextButton = document.getElementById("next-button")
const previousButton = document.getElementById("previous-button")
const title = document.getElementById("title")
const artist = document.getElementById("artist")
const image = document.getElementById("image")
const urlMain = "https://rufi512.github.io/manzdev-retos-mp3-player"
const request = () => {
    fetch(`${urlMain}/data/songs.json`)
        .then((res) => { return res.json() }).then((data) => {
            tracks = data
            data.map((el, i) => {
                const list = document.getElementById("track-list")
                list.innerHTML += `<li onclick="changeTrack(${i})">${i+1}. ${el.artist} - ${el.title}</li>`
            })
            changeTrack(trackPosition)

        }).catch((err) => console.log(err))
}

try {
    request()
} catch (error) {
    setTimeout(() => {
        request()
    }, 3000);
}

const formatTime = (seconds) => {
    minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    return minutes + ":" + seconds;
}

/*Show current line time*/
setInterval(() => {
    if (audio.duration && audio.currentTime) {
        audioLengthIndicator.innerText = formatTime(audio.duration)
        currentTimeText.innerText = formatTime(audio.currentTime)
        if (!isTouching) lineIndicator.style.width = `${Math.round(audio.currentTime/audio.duration * 100)}%`
    }
}, 10)

/*Indicator line volumen and track*/
const setLinePosition = (e, origin, indicator) => {
    if (origin) touchOrigin = origin
    let current
    let percentage
    let position
    let coordenated
    if (indicator) {
        if (touchOrigin === "volume") percentage = Math.abs(indicator * 100);
    }

    if (e !== null) {
        if (touchOrigin === "time") {
            if (lastPositionTouchScreen) coordenated = lastPositionTouchScreen.clientX
            if (!lastPositionTouchScreen) coordenated = e.clientX || e.touches[0].clientX
            position = coordenated - container.offsetLeft;
            current = currentIndicator
        }
        if (touchOrigin === "volume") {
            if (lastPositionTouchScreen) coordenated = lastPositionTouchScreen.clientX
            if (!lastPositionTouchScreen) coordenated = e.clientX || e.touches[0].clientX
            position = coordenated - container.offsetLeft - volumeBar.offsetLeft
            current = volumeBar
        }
        percentage = 100 * position / current.clientWidth;

    }

    const checkLimit = () => {
        if (percentage >= 100) percentage = 100
        if (percentage < 0) percentage = 0
    }

    /*Change the time position of the audio*/
    if (touchOrigin === "time" && percentage) {
        if (!audio.duration) return
        checkLimit()
        lineIndicator.style.width = `${Math.round(percentage,2)}%`
        if (!isTouching) audio.currentTime = Math.round(percentage / 100 * audio.duration)
    }

    /*Change the volume*/
    if (touchOrigin == "volume" && percentage) {
        checkLimit()
        percentage = Math.round(percentage, 2)
        volumeIndicator.style.width = `${percentage}%`
        if (percentage <= 40) volumeIndicator.style.background = "#3cc747";
        if (percentage >= 41 && percentage <= 79) volumeIndicator.style.background = "#ffeb3b";
        if (percentage >= 80 && percentage <= 100) volumeIndicator.style.background = "#ef2121";
        localStorage.setItem("volume", (percentage / 100))
        audio.volume = (percentage / 100)
        lastPositionTouchScreen = false

    }
}


// Volume meter
// Set initial function for Volume meter
const audioCtx = new(window.AudioContext || window.webkitAudioContext)
const analyser = audioCtx.createAnalyser()
const source = audioCtx.createMediaElementSource(audio)

// Set canvas and connect the source audio and analyzer
const canvas = document.querySelector('#canvas')
const ctx = canvas.getContext('2d')
ctx.fillStyle = `#35353a`
let array_new
let bar_x
let bar_width
let bar_height
let bars = 500
let wait_resume_ms = 0

window.addEventListener("load", () => {
    source.connect(analyser);
    analyser.connect(audioCtx.destination)
    drawLines()
}, false)

// Necessary if the function for line 146 is === undefined
window.setInterval(() => {
    array_new = new Uint8Array(analyser.frequencyBinCount);
})

const drawLines = () => {
    window.requestAnimationFrame(drawLines)
    analyser.getByteFrequencyData(array_new)

    if (audio.paused) {
        ctx.fillRect(bar_x, canvas.height + 40, bar_width, bar_height)
        wait_resume_ms = 50
        return
    }

    // Wait to clean the canvas
    if (wait_resume_ms !== 0) {
        setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            wait_resume_ms = 0
        }, wait_resume_ms)
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }


    for (let i = 0; i < bars; i++) {
        bar_x = i * 3
        bar_width = 2
        bar_height = -(array_new[i] / 1.3543)
        ctx.fillRect(bar_x, canvas.height + 40, bar_width, bar_height)
    }

}

//Track Controls

const playAndPause = () => {
    const buttons = document.querySelector('.buttons')
    if (tracks.length === 0) return

    if (!isPlaying) {
        isPlaying = true
        buttons.classList.add("active-play")
        return audio.play()
    }
    isPlaying = false
    buttons.classList.remove("active-play")
    audio.pause()

}

const changeTrack = (position) => {
    if (position + 1 >= tracks.length) nextButton.disabled = true
    if (position + 1 < tracks.length) nextButton.disabled = false
    if (position < 1) previousButton.disabled = true
    if (position > 0) previousButton.disabled = false
    trackPosition = position
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    isPlaying = true
    playAndPause()
    lineIndicator.style.width = `0%`
    audio.currentTime = 0
    currentTimeText.innerText = '0:00'
    audioLengthIndicator.innerText = '-:-'
    title.innerHTML = tracks[trackPosition].title
    artist.innerHTML = tracks[trackPosition].artist
    image.src = `${urlMain}/data/covers/${tracks[trackPosition].image}`
    audio.src = `${tracks[trackPosition].url}`
}

const nextTrack = () => {
    changeTrack((trackPosition + 1));
}

const previousTrack = () => {
    changeTrack((trackPosition - 1));
}


/*Set Listener */
volume_user = localStorage.getItem("volume") || 0.4
setLinePosition(null, 'volume', volume_user)

currentIndicator.addEventListener("mousedown", (e) => {
    isTouching = true
    setLinePosition(e, 'time')
})

volumeBar.addEventListener("mousedown", (e) => {
    isTouching = true
    setLinePosition(e, 'volume')
})

document.addEventListener('mousemove', (e) => {
    if (!isTouching) return
    setLinePosition(e)
});

document.addEventListener('mouseup', (e) => {
    if (isTouching) {
        isTouching = false
        setLinePosition(e)
    }
});


/*Touch mobile*/

currentIndicator.addEventListener("touchstart", (e) => {
    e.preventDefault()
    isTouching = true
    setLinePosition(e, 'time')
}, false)

volumeBar.addEventListener("touchstart", (e) => {
    e.preventDefault()
    isTouching = true
    setLinePosition(e, 'volume')
}, false)

document.addEventListener('touchmove', (e) => {
    if (!isTouching) return
    setLinePosition(e)
},false);


document.addEventListener('touchend', (e) => {
    if (isTouching) {
        isTouching = false
        lastPositionTouchScreen = e.changedTouches[0]
        setLinePosition(e)
    }

});