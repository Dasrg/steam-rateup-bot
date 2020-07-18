const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const Colors = require('colors');
const path = require("path");
var async = require('async');
var fs = require("fs");
let config = null;

var community = new SteamCommunity();

var text = fs.readFileSync("./bots.txt").toString('utf-8');
var bot = text.split("\n")
config = require(path.resolve("config.json"));
let configRaw = fs.readFileSync("./config.json").toString();
const id = config.id;
const perChunk = config.perChunk;
const betweenChunks = config.betweenChunks;

console.log('%s is steam content ID'.gray, id);

var ss = 0;
var ff = 0;


(async() => {
    let subbot = []; 
    for (let i = 0; i <Math.ceil(bot.length/perChunk); i++){
        subbot[i] = bot.slice((i*perChunk), (i*perChunk) + perChunk);
    }
	console.log('Total %s accounts and %s chunks'.cyan, bot.length, subbot.length);
	for (let ii = 0; ii < subbot.length; ii++) {
		var s = 0;
		var f = 0;
		async.each(subbot[ii], function(item, callback){
			
			const logOnOptions = {
				accountName: item.split(":")[0],
				password: item.split(":")[1],
				twoFactorCode: SteamTotp.generateAuthCode(item.split(":")[2]),
			};  
			
			community.login({
				"accountName": logOnOptions.accountName,
				"password": logOnOptions.password,
				"twoFactorCode": logOnOptions.twoFactorCode
				},
				function (err, sessionID, cookies, steamguard, oAuthToken) {
					if (err) { console.log('[%s] Unable to auth (Error: %s)'.red, logOnOptions.accountName, err); f++; ff++; callback(); }
					if (!err) {
						console.log('[%s] Successfully logged on (Session ID: %s)'.yellow, logOnOptions.accountName, sessionID);
						var options = {
							formData: {
								id: id,
								sessionid: sessionID
							},
							headers: {
								Cookie: cookies,
								Host: 'steamcommunity.com',
								Origin: 'https://steamcommunity.com'
							},
							json: true
						};					
						community.httpRequestPost(
							'https://steamcommunity.com/sharedfiles/voteup', options,
							function (err, res, data) {
								if (err) {
									console.log('err', err); f++; ff++;
								}
								if (!err) {
								 if (data.success == 1) { console.log('[%s] Successfully voted up with response code %s'.green, logOnOptions.accountName, data.success); s++; ss++;}
								 else { console.log('[%s] something went wrong. Response code %s'.red, logOnOptions.accountName, data.success); f++; ff++;}
								callback();
								}
							},
							"steamcommunity"
						);
					}
			});				
		}, function(err) {
				console.log('Chunk %s finished: Successfully sent %s rates up and %s failed requests'.white, ii + 1, s, f);
				if (ii < subbot.length - 1) console.log('Waiting %s ms for the next chunk'.cyan, betweenChunks);
		});
		if (ii < subbot.length) await new Promise(r => setTimeout(r, betweenChunks));
	};
	console.log('Successfully sent %s rates up and %s failed requests', ss, ff);
})();

