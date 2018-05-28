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
let lines = []
io.on('connection', function (socket) {
    socket.on('userConnect', (ip) => { //using ip to get country for flag emoji
        let u = {
            id: socket.id,
            ip: ip.ip
        }
        u.name = ip.name || "unknown"
        let country = geoip.lookup(u.ip).country
        u.flag = flags.find(x => x.em === country.toLocaleLowerCase()).afeld
        log(u.name + " connected")
        users.push(u)
    })

    socket.on('disconnect', () => {
        log(users.find(x => x.id === socket.id).name + ' disconnected')
        users = users.filter(x => x.id !== socket.id)
    })

    socket.on('draw', (line) => {
        lines.push(line)
        socket.broadcast.emit('draw', line)
    })
    socket.on('delete', () => {
        lines = []
        io.emit('delete')
    })

    socket.on('messageback', message => {
        console.log(message)
        let u = users.find(x => x.id === message.id)
        log(u.name + ": " + message.m)
        io.emit("message", {
            flag: u.flag,
            name: u.name,
            message: message.m
        })
    })


    app.get('/api/lines', function (req, res) {
        res.status(200).json({
            data: lines
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
