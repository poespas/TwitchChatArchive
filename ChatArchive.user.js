// ==UserScript==
// @name         Archive twitch chat
// @namespace    http://poespas.me
// @version      0.3.1
// @description  Get the twitch chat with the archived twitch vid.
// @author       SpiderDead, Poespas
// @match        https://*.youtube.com/*
// @require      https://twitchchat.poespas.me/jquery.min.js
// @updateURL    https://twitchchat.poespas.me/ChatArchive.meta.js
// @downloadURL  https://twitchchat.poespas.me/ChatArchive.user.js
// ==/UserScript==

var loaded = false;

var player;
var vodId;

var twitch_messages = [];
var lastTime = 0;

var msgCount = 0;

var chatcolor = 0;

function init(keywords) {
    twitch_messages = [];
    vodId = null;
    lastTime = 0;
    msgCount = 0;

    var isOurs = false;

    for (var i = 0; i < keywords.length; i++) {
        var word = keywords[i];

        if (word.startsWith("tchat-")) {
            isOurs = true;
            vodId = word.replace("tchat-", "");
            break;
        }

    }

    console.log({ isOurs, vodId });
    loaded = true;

    if (!isOurs) {
        cleanUp();

        return;
    }

    player = document.getElementsByClassName("video-stream")[0];
    player.ontimeupdate = onTimeUpdate;

    downloadChat();

    document.getElementById("donation-shelf").innerHTML = `<style>
		#twitch-chat::-webkit-scrollbar-track
		{
		    background-color: var(--yt-spec-feed-background-c);
		    border-left: 1px solid var(--yt-spec-feed-background-a);
		    border-right: 1px solid var(--yt-spec-feed-background-a);
		}

		#twitch-chat::-webkit-scrollbar
		{
		    width: 6px;
		    background-color: var(--yt-spec-feed-background-c);
		}

		#twitch-chat::-webkit-scrollbar-thumb
		{
		    border-radius: 10px;
		    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
		    background-color: var(--yt-spec-text-secondary);
		}
		.tc-title {
		color: var(--yt-spec-text-primary);
		    font-size: 1.6rem;
		    font-weight: 400;
		    line-height: 2rem;
		    -ms-flex: 1 1 0.000000001px;
		    -webkit-flex: 1;
		    flex: 1;
		    text-align: center;
		    -webkit-flex-basis: 0.000000001px;
		    flex-basis: 0.000000001px;
		    padding-bottom: 4px;
		    border-bottom: 1px solid var(--yt-spec-10-percent-layer);
		}
		#twitch-shelf {
		    padding-bottom: 8px;
		    border-bottom: 1px solid var(--yt-spec-10-percent-layer);
		    margin-bottom:  20px;
		}
		#twitch-chat {
		    background-color: var(--yt-spec-feed-background-c);
		    color: var(--yt-live-chat-primary-text-color, var(--yt-primary-text-color));
		    height: 500px;
		    width: 100%;
		    margin-bottom: 10px;
		    overflow-y: scroll;
		    padding: 5px 0;
		    font-size: 12px;
		    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
		}
		#twitch-msg {
		    padding: 2px 5px;
		    min-height: 18px;
		    line-height: 18px;
		}
                .twitch-msg img { 
                    vertical-align: middle;
                    height: 100%; 
                }

                .twitch-user {
                    font-weight: 500;
                    color: black;
                }
	</style>
	<div id="twitch-shelf" class="style-scope ytd-watch-flexy">
	    <h2 class="tc-title">Twitch Chat</h2>
	    <div id="twitch-chat">
	    	<div class="twitch-msg" style="text-align: center;">Downloading Twitch Chat..</div>
            </div>
        </div>`;
}

function onTimeUpdate() {
    var time = player.currentTime;

    var j = 0;

    if (lastTime + 10 < time || time + 10 < lastTime) {
        //fast forward, need to remove all, and reset
        lastTime = time;
        document.getElementById("twitch-chat").innerHTML = "";
    }


    for (var i = 0; i < twitch_messages.length; i++) {
        let msg = twitch_messages[i];

        if (msg.offset_seconds >= lastTime && msg.offset_seconds <= player.currentTime) {
            //console.log("["+msg.user_color+"] " + msg.display_name + " > " + msg.body);
            addMessage(msg);
        }
        if (msg.offset_seconds > player.currentTime) {
            break;
        }
    }


    lastTime = player.currentTime;
}

function intToRGB(i) {
    var c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}

function userColor(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return intToRGB(hash);
}

function addMessage(msg) {
    var elem = document.getElementById('twitch-chat');

    var scrollBottom = (elem.scrollHeight <= elem.scrollTop + elem.offsetHeight + 20);

    $("#twitch-chat").append(`<div class="twitch-msg" style="background-color: ${(chatcolor == 1 ? 'var(--yt-spec-feed-background-c)' : 'var(--yt-spec-feed-background-b)')}"><span class="twitch-user" style="color: ${(msg.user_color ? msg.user_color : "#" + userColor(msg.display_name))};">${msg.display_name}:</span> ${msg.body}</div>`);

    if (chatcolor == 1) {
        chatcolor = 0;
    } else {
        chatcolor = 1;
    }

    if (scrollBottom)
        elem.scrollTop = elem.scrollHeight;

    msgCount = elem.getElementsByClassName("twitch-msg").length;

    while (msgCount > 100) {
        elem.removeChild(elem.getElementsByClassName("twitch-msg")[0]);
        msgCount = elem.getElementsByClassName("twitch-msg").length;
    }
}

function downloadChat() {
    $.get(`https://twitchchat.poespas.me/${vodId}`, function (data) {
        twitch_messages = data;
        $('#twitch-chat').html(`<div class="twitch-msg" style="text-align: center;">Downloaded + Loaded Archived Twitch Chat.</div>`);
    }).fail(function () {
        $('#twitch-chat').html(`<div class="twitch-msg" style="text-align: center;">Failed getting chat history!</div>`);
    });
}

function GM_addStyle(cssStr) {
    var D = document;
    var newNode = D.createElement('style');
    newNode.textContent = cssStr;

    var targ = D.getElementsByTagName('head')[0] || D.body || D.documentElement;
    targ.appendChild(newNode);
}

function cleanUp() {
    var element = document.getElementById("twitch-shelf");

    if (player && player.ontimeupdate)
        player.ontimeupdate = () => { };

    if (element)
        element.parentNode.removeChild(element);
}

function start() {
    console.log("start");
    console.log({ pathname: location.pathname });

    cleanUp();

    if (location.pathname != "/watch")
        return;

    $.get(location.href, function (data) {
        if (!data.includes("ytplayer.config = "))
            return start();

        var ytplayer = /ytplayer\.config = (\{.*\:\{.*\:.*\}\});/gm.exec(data);
        //console.log({ytplayer})

        if (!ytplayer)
            return start();

        unsafeWindow.ytplayer = JSON.parse(ytplayer[1]);
        unsafeWindow.player_response = JSON.parse(unsafeWindow.ytplayer.args.player_response);

        var keywords = unsafeWindow.player_response.videoDetails.keywords;

        if (!keywords)
            return;

        //console.log(keywords);

        init(keywords);
    });

    console.log(unsafeWindow);
}


window.addEventListener("spfdone", start); // old youtube design
window.addEventListener("yt-navigate-start", start); // new youtube design

window.addEventListener("load", start); // one-time late postprocessing
