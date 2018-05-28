let express = require('express')
let he = require('he')
let fs = require("fs")
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
let geoip = require('geoip-lite')
let flags = require("./flags.json")
let logFile = fs.createWriteStream("log.txt", {
    flags: 'a'
})
app.use(express.static('client'))

app.use('/', express.static(__dirname))

let users = []
let messages = []
let lines = []
io.on('connection', function (socket) {
    socket.on('userConnect', (ip) => { //using ip to get country for flag emoji
        let u = {
            id: socket.id,
            ip: ip.ip
        }
        let country = geoip.lookup(u.ip).country
        u.flag = flags.find(x => x.em === country.toLocaleLowerCase()).afeld
        log(u.ip + " connected (" + u.flag + ")")
        users.push(u)
    })

    socket.on('disconnect', () => {
        let u = users.find(x => x.id === socket.id)
        let name = "-"
        if (u) name = u.name
        log(name + ' disconnected')
        io.emit('logout', name)
        users = users.filter(x => x.id !== socket.id)
    })

    socket.on("login", (login) => {
        let u = users.find(x => x.id === socket.id)
        if (!u) return
        if (login.m.length > 25) login.m = "too long"
        login.m = he.encode(login.m)
        log(login.m + " logged in")
        u.name = login.m
        io.emit("login", login.m)
    })

    socket.on('draw', (line) => {
        lines.push(line)
        socket.broadcast.emit('draw', line)
    })
    socket.on('delete', () => {
        lines = []
        io.emit('delete')
    })

    socket.on('message', message => {
        let u = users.find(x => x.id === message.id)
        if (!u) return
        message.m = he.encode(message.m)
        if (message.m.length > 250) message.m = u.name + " tried to spam"
        log(u.name + ": " + message.m)

        message = {
            flag: u.flag,
            name: u.name,
            message: message.m
        }
        io.emit("message", message)
        messages.push(message)
    })

    app.get('/api/lines', function (req, res) {
        log("requested lines: length " + lines.length)
        res.status(200).json({
            data: lines
        });
    });
    app.get('/api/messages', function (req, res) {
        log("requested messages: length " + messages.length)
        res.status(200).json({
            data: messages
        });
    });

})

http.listen(3000, function () {
    console.log('listening on *:3000')
})

function log(st) {
    console.log(st)
    logFile.write("[" + new Date().toLocaleTimeString() + "] " + st + "\r\n");
}
