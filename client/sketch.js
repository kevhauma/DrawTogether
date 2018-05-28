window.addEventListener('load', init, false)
let socket
let slider, toolbox, info, picker, login
let allowedToDraw = true
let connected, started = false,
    loggedIn = false
let typePlace, chatHeader, collapsable, chatWindow, chat
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
    color: "black",
    shape: "line"
}

// P5 drawing stuff
//-----------------------------
function setup() {
    let cnv = createCanvas(2500, 2500)
    cnv.style('border', 'solid');
    background(255)

    let lines = REST("GET", "/api/lines").data
    for (let i = 0; i < lines.length; i++)
        drawLine(lines[i])

}

function mouseMoved() {
    lineToDraw.curr.X = mouseX
    lineToDraw.curr.Y = mouseY
    updateInfo()
}

function mouseDragged() {
    if (!connected || !loggedIn || !allowedToDraw) return
    if (mouseIsPressed && mouseButton === "center") return
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return
    if (!started) {
        lineToDraw.prev = lineToDraw.curr
        started = true
    }
    lineToDraw.curr.X = mouseX
    lineToDraw.curr.Y = mouseY
    socket.emit("draw", lineToDraw)
    drawLine(lineToDraw)
    updateInfo()

}

function mouseReleased() {
    started = false
}

function drawLine(l) {
    switch (l.shape) {
        case "line":
            stroke(color(l.color))
            strokeWeight(l.width)
            line(l.curr.X, l.curr.Y, l.prev.X, l.prev.Y)
            l.prev = {
                X: mouseX,
                Y: mouseY
            }
            break
        case "rect":
            rectMode(CENTER)
            fill(color(l.color))
            noStroke()
            rect(l.curr.X, l.curr.Y, l.width, l.width)
            break
        case "circ":
            ellipseMode(CENTER)
            fill(color(l.color))
            noStroke()
            ellipse(l.curr.X, l.curr.Y, parseInt(l.width))
    }

}
//-----------------------------


// HTML stuff
//-----------------------------
function init() {
    socket = io()
    loadDOMelements()
    addEventListeners()
    updateInfo()
    loggingIn(false)

    socket.emit("userConnect", REST('GET', 'https://api.ipify.org?format=json'))
    let mes = REST('GET', '/api/messages').data
    for (let i = 0; i < mes.length; i++) {
        let m = mes[i]
        chat.innerHTML += '<li ><div id = "name" > <i class="' + m.flag + '"></i> ' + m.name + '</div> <div id = "message" > ' + m.message + '</div> <hr> </li>'
    }
    updateScroll()

    connected = true
    addSocketListeners()
}


function changeColor(obj) {
    lineToDraw.color = obj.id
    if (obj.id == "white") {
        lineToDraw.width = 50;
        slider.value = 50
    } else lineToDraw.width = slider.value
    updateInfo()
}

function updateInfo() {
    info.innerHTML = `(${Math.floor(lineToDraw.curr.X)},${Math.floor(lineToDraw.curr.Y)}) color: ${lineToDraw.color} - width ${lineToDraw.width}`
}

function loadDOMelements() {
    toolbox = document.getElementById("toolbox")
    info = document.getElementById("info")
    slider = document.getElementById("slider")
    picker = document.getElementById("picker")
    typePlace = document.getElementById("typingplace")
    chatHeader = document.getElementById("chatHeader")
    collapsable = document.getElementById("collapsable")
    chatWindow = document.getElementById("chatWindow")
    chat = document.getElementById("chat")
    login = document.getElementById("login")
    updateScroll()
}

function addEventListeners() {
    typePlace.addEventListener("keyup", event => {
        if (event.key === "Enter") {
            if (loggedIn) {
                socket.emit("message", {
                    id: socket.id,
                    m: typePlace.value
                })
                typePlace.value = ""
            }
        }
    })
    login.addEventListener("keyup", event => {
        if (event.key === "Enter") {
            if (connected) {
                socket.emit("login", {
                    id: socket.id,
                    m: login.value
                })
                login.value = ""
                loggingIn(true)
            }
        }
    })
    picker.addEventListener("change", () => {
        lineToDraw.color = picker.value
    })
    slider.addEventListener("mouseover", () => {
        allowedToDraw = false
    })
    slider.addEventListener("mouseleave", () => {
        allowedToDraw = true
    })
    chatWindow.addEventListener("mouseover", () => {
        allowedToDraw = false
    })
    chatWindow.addEventListener("mouseleave", () => {
        allowedToDraw = true
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
    slider.addEventListener("change", () => {
        lineToDraw.width = slider.value
        updateInfo()
    })
    let chatCollapsed = true
    chatHeader.addEventListener("click", () => {
        if (chatCollapsed) {
            collapsable.style.display = "block"
            chatWindow.style.height = "300px"
        } else {
            collapsable.style.display = "none"
            chatWindow.style.height = "25px"
        }
        chatCollapsed = !chatCollapsed;
    })
}

function addSocketListeners() {
    socket.on("draw", (rLine) => {
        drawLine(rLine)
    })
    socket.on("delete", () => {
        fill(255)
        noStroke()
        rect(0, 0, width, height)
    })
    socket.on("login", login => {
        chat.innerHTML += '<li> <div id="metaChat">' + login + ' logged in </div><hr></li>'
    })
    socket.on("logout", logout => {
        chat.innerHTML += '<li> <div id="metaChat">' + logout + ' logged out</div> <hr></li>'
    })
    socket.on("message", m => {
        chat.innerHTML += '<li ><div id = "name" > <i class="' + m.flag +
            '"></i> ' + m.name + '</div> <div id = "message" > ' + m.message + '</div> <hr> </li>'
        updateScroll()
    })
}

function loggingIn(b) {
    let con = document.getElementById("connected")
    let discon = document.getElementById("notConnected")
    if (b) {
        con.style.display = "block"
        discon.style.display = "none"
    } else {
        con.style.display = "none"
        discon.style.display = "block"
    }
    loggedIn = b
}


function updateScroll() {
    var element = document.getElementById("chat");
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
