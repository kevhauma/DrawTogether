let express = require('express')
let he = require('he')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
app.use(express.static('client'))

app.use('/', express.static(__dirname))


let lines = []
io.on('connection', function (socket) {
    console.log('a user connected')
    socket.on('disconnect', function () {
        console.log('user disconnected')
    })

    socket.on('sendback', (line) => {
        lines.push(line)
        io.emit('line', line)
    })
    socket.on('delete', () => {
        lines = []
        io.emit('delete')
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
