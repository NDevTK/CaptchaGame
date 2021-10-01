/*jshint esversion: 8 */

// NDev 2020 https://github.com/NDevTK/CaptchaGame

// Require sandbox
if (window.origin !== "null") {
  navigator.serviceWorker.register("https://ndev.tk/sw.js").then(_ => {
    location.reload(true);
  });
  throw "Added protection"
}


var Rows = [];
var username = GetUsername();

//var best = localStorage.getItem("best");
//if(isNaN(best) || best === null)
setBest();

function setBest(value = 0) {
//localStorage.setItem("best", value);
best = value;
}

alert("Your best score is: "+best);
const server = new WebSocket('wss://captchagame.herokuapp.com');

server.onerror = function(event) {
    GoHome("WebSocket Connection Error");
};

server.onopen = function(event) {
    hcaptcha.render('captcha', { 'sitekey':'4ad51acf-0c8f-47f3-83ea-aa29e09351df', 'theme':'dark', 'callback':'captcha'});
    scoreboard = document.getElementById('scoreboard');
    TimeBasedSetInterval(Ticker, 1000);
    server.send(username);
};

function TimeBasedSetInterval(func, time) {
    var lastTime = Date.now(),
        lastDelay = time,
        outp = {};

    function tick() {
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

function Ticker() {
    Rows.forEach((element, ID) => {
        Rows[ID].Score.innerText -= 1;
        if (element.Score.innerText < 1) {
            scoreboard.deleteRow(ID);
            if(Rows[ID].mine) Reload("You Died :(");
            delete Rows.splice(ID, 1);
        }
    });
}

function Reload(why) {
    alert(why);
    location.reload();
}

function UpdateScore(ID) {
    Rows[ID].Score.innerText = parseInt(Rows[ID].Score.innerText) + 10;
    Rows[ID].Solved.innerText = parseInt(Rows[ID].Solved.innerText) + 1;
    if(best < parseInt(Rows[ID].Solved.innerText) && Rows[ID].mine) setBest(parseInt(Rows[ID].Solved.innerText));
}

function NewPlayer(ID) {
    Rows[ID] = {};
    var Row = scoreboard.insertRow(1);
    Rows[ID].Nickname = Row.insertCell(0);
    Rows[ID].Score = Row.insertCell(1);
    Rows[ID].Solved = Row.insertCell(2);
} 

function PlayerData(Nickname, Score, Solved, ID = Rows.length) {
    if (!Rows.hasOwnProperty(ID)) {
        NewPlayer(ID);
    }
    Rows[ID].Nickname.innerText = Nickname;
    Rows[ID].Score.innerText = Score;
    Rows[ID].Solved.innerText = Solved;
    return ID;
}

function GoHome(why) {
    if(why !== "canceled") alert(why);
    window.location.replace("/#" + why);
}

function GetUsername() {
    //let username = window.sessionStorage.getItem("username");
    let username = null;
    if (username === null) username = prompt("Please enter a username (optional):");
    if (username === null) {
        GoHome("canceled"); 	
    } else {
        window.sessionStorage.setItem("username", username);
    }
    return (!username) ? "Unnamed player" : username;
}

function captcha() {
    var responce = hcaptcha.getResponse();
    server.send(responce);
    hcaptcha.reset();
}

var mine = true;
server.onmessage = function(msg) {
    var json = ParseJSON(msg.data);
    if (json) {
        if (Array.isArray(json)) {
            json.forEach((Player) => {
                PlayerData(Player.Nickname, Player.Score, Player.Solved);
            });
        } else {
            var index = PlayerData(json.Nickname, json.Score, json.Solved);
            if(mine) {
            mine = false;
            Rows[index].mine = true;
            }
		}
	} else if(!isNaN(msg.data)) {
		UpdateScore(msg.data);
	}
};

function ParseJSON(str) { // Attempt to parse JSON
    if(!isNaN(str)) return false;
    try {
        return JSON.parse(str);
    } catch (e) {
        return false;
    }
}
