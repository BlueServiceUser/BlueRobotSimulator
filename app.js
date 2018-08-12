var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res){
    res.sendFile(__dirname + "/index.htm");
})

app.get('/controller', function (req, res){
    res.sendFile(__dirname + "/robotController.htm");
})

function writePos(position)
{
    return "X:" + position.x + " Y:" + position.y + " Z:" + position.z;
}



io.on('connection', function(socket){
    console.log("Connected.")
    socket.on('moveRobot', function(position)
    {
        io.emit('moveRobot', position);
        console.log("moverobot:" + writePos(position));
    });

    socket.on('objectMove', function(params)
    {
        io.emit('objectMove', params);
        console.log("objectMove:" + writePos(params));
    });

    socket.on('objectMoved', function(params)
    {
        io.emit('objectMoved', params);

        console.log("objectMoved:" + writePos(params));
    });


    socket.on('eventMessage', function(message)
    {
        io.emit('eventMessage', message);
        console.log("eventMessage:" + message);
    });


    socket.on('addBox', function(position)
    {
        io.emit('addBox', position);
        console.log("addBox:" + writePos(position));
    });

    socket.on('pickupBox', function(position)
    {
        io.emit('pickupBox', position);
        console.log("pickupBox:" + writePos(position));
    });
    

    socket.on('boxPlaced', function(position)
    {
        io.emit('boxPlaced', position);
        console.log("boxPlaced:" + writePos(position));
    });


    socket.on('placeBox', function(position)
    {
        io.emit('placeBox', position);
        console.log("placeBox:" + writePos(position));
    });

});

app.use(express.static('scripts'));
app.use(express.static('img'));
app.use(express.static('node_modules/three'));
app.use(express.static('node_modules/three/examples/'));
app.use(express.static('node_modules'));

http.listen(80, function (){
    console.log("Listening on *:80")
})
