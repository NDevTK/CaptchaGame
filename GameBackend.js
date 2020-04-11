// NDev 2020
const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const fetch = require('node-fetch');
var request = require('request');
const token = "N/A";
Rows = [];

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', function connection(ws) {
  ws.isAlive = true;
  ws.on('pong', heartbeat);
});

function heartbeat() {
  this.isAlive = true;
}

function broardcast(message) {
	wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
}

function noop() {}

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

TimeBasedSetInterval(Ticker, 1000);

function TimeBasedSetInterval(func, time){
    var lastTime = Date.now(),
        lastDelay = time,
        outp = {};
    
    function tick(){
        func();

        var now = Date.now(),
            dTime = now - lastTime;

        lastTime = now;
        lastDelay = time + lastDelay - dTime;
        outp.id = setTimeout(tick, lastDelay);
    }
    outp.id = setTimeout(tick, time);

    return outp;
}

function Ticker(){
Rows.forEach((element, ID) => {
	Rows[ID].Score -= 1;
	if(Rows[ID].Score < 1) delete Rows.splice(ID, 1);
});
}

wss.on('connection', function connection(ws) {
  var NeedStats = true;
  var ID;
  var player;
  var reply;
  var StartTime;
  ws.on('message', function incoming(message) {
	if(!message) return;
	if(NeedStats) {
		NeedStats = false;
		player = {};
		player.Nickname = message;
		player.Score = 20;
		player.Solved = 0;
		if(Rows.length != 0) ws.send(JSON.stringify(Rows));
		StartTime = new Date().time;
		broardcast(JSON.stringify(player));
		ID = Rows.push(player) - 1;
	} else {
    request.post({url:'https://hcaptcha.com/siteverify', form: {secret:"N/A", response: message}}, function(err,httpResponse,body){
      if (err) return;
      try {
        reply = JSON.parse(body);
      } catch (e) {return};
        if(reply.challenge_ts && new Date(reply.challenge_ts).getTime() > StartTime) return;
        if(reply.success === true) {
          Rows[ID].Score += 10;
          Rows[ID].Solved += 1;
	  increment(token, Rows[ID].Nickname);
          broardcast(ID);
        };
    });
    }
  });
});

async function increment(token, username = "Unnamed Player", number = 1) {
    let r = await fetch('https://gsapi.ndev.tk/api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: token,
            username: username,
            increment: number
        })
    });
    return r.json();
}
