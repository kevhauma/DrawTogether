window.addEventListener('load', init, false)
let socket
let slider
let connected, started = false
let typePlace, chatHeader
let lineToDraw = {
    curr: {
        X: 0,
        Y: 0
    },
    prev: {
        X: 0,
        Y: 0
    },
    width: 2,
    color: "black"
}

// P5 drawing stuff
//-----------------------------
function setup() {
    let cnv = createCanvas(2500, 2500)
    cnv.style('border', 'solid');
    background(255)
}

function mouseMoved() {
    lineToDraw.curr.X = mouseX
    lineToDraw.curr.Y = mouseY
    updateInfo()
}

function mouseDragged() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return
    if (!started) {
        lineToDraw.prev = lineToDraw.curr
        started = true
    }
    drawLine()
}

function mouseReleased() {
    started = false
}

function drawLine() {
    stroke(color(lineToDraw.color))
    strokeWeight(lineToDraw.width)
    line(mouseX, mouseY, lineToDraw.prev.X, lineToDraw.prev.Y)
    lineToDraw.prev = {
        X: mouseX,
        Y: mouseY
    }
}
//-----------------------------


// HTML stuff
//-----------------------------
function init() {
    socket = io()
    connected = true
    loadDOMelements()
    addEventListeners()
    updateInfo()
    addSocketListeners()
}

function lineWidth() {
    console.log(slider.value)
    lineToDraw.width = slider.value
    updateInfo()
}

function changeColor(obj) {
    lineToDraw.color = obj.id
    if (obj.id == "white") lineToDraw.width = 14
    else lineToDraw.width = slider.value
    updateInfo()
}

function updateInfo() {
    info.innerHTML = `(${Math.floor(lineToDraw.curr.X)},${Math.floor(lineToDraw.curr.Y)}) color: ${lineToDraw.color} - width ${lineToDraw.width}`
}

function loadDOMelements() {
    info = document.getElementById("info")
    slider = document.getElementById("slider")
    typePlace = document.getElementById("typingplace")
    chatHeader = document.getElementById("chatHeader")
    updateScroll()
}

function addEventListeners() {
    typePlace.addEventListener("keyup", event => {
        if (event.key === "Enter") {
            //send message
        }
    })
    document.getElementById("btnErase").addEventListener('click', () => {
        socket.emit('delete')
        noStroke()
        fill(255)
        rect(0, 0, width, height)
    })
    document.getElementById("saveIMG").addEventListener('click', () => {
        socket.emit("saved")
        saveCanvas("image")
    })
    slider.addEventListener("change", lineWidth, false)
}

function addSocketListeners() {
    socket.on("line", (rLine) => {
        receiveDraw(rLine)
    })
    socket.on("delete", () => {
        fill(255)
        noStroke()
        rect(0, 0, width, height)
    })
}



function updateScroll() {
    var element = document.getElementById("chatConv");
    element.scrollTop = element.scrollHeight;
}

function REST(method, url, message) {
    var xhttp = new XMLHttpRequest()
    xhttp.open(method, url, false)
    xhttp.setRequestHeader("Content-type", "application/json")
    if (message)
        xhttp.send(message)
    else
        xhttp.send()
    return JSON.parse(xhttp.responseText)

}
