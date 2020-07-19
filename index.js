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

var allSuccessLikes = 0;
var allFailedLikes = 0;
var allSentFavorites = 0;

(async() => {
	// Getting chunks:
    let subbot = []; 
    for (let i = 0; i <Math.ceil(bot.length/perChunk); i++){
        subbot[i] = bot.slice((i*perChunk), (i*perChunk) + perChunk);
    }
	
	console.log('Total %s accounts and %s chunks'.cyan, bot.length, subbot.length);
	if (config.favorites == false) console.log('Likes: %s, Favorites: %s'.cyan, config.likes, config.favorites);
	if (config.favorites == true) console.log('Likes: %s, Favorites: %s. Indicated App_ID: %s'.cyan, config.likes, config.favorites, config.appid);
	if (config.limited ==true) console.log('You set LIMITED accounts. Use this format in the BOTS.TXT:'.black.bgWhite + '"login:password:"'.blue.bgWhite+'(with the colon in the end of lines)'.black.bgWhite);
	for (let ii = 0; ii < subbot.length; ii++) {
		
		var successLikes = 0;
		var failedLikes = 0;	
		var sentFavorites = 0;	

		async.each(subbot[ii], function(item, callback){
			// Using unlimited accounts with Steam Guard for likes and favorite:
			if (config.limited == false) {
				// Splitting each line to login, password, shared_secret:
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
						if (err) { console.log('[%s] Unable to auth (Error: %s)'.red, logOnOptions.accountName, err); failedLikes++; allFailedLikes++; callback(); }
						if (!err) {
							(async() => {
												
							console.log('[%s] Successfully logged on (Session ID: %s)'.yellow, logOnOptions.accountName, sessionID);
							var optionsLike = {
								formData: {	id: id,	sessionid: sessionID },
								headers: { Cookie: cookies, Host: 'steamcommunity.com', Origin: 'https://steamcommunity.com' },
								json: true
							};
							var optionsFavorite = {
								formData: {	id: id,	appid: config.appid, sessionid: sessionID },
								headers: { Cookie: cookies, Host: 'steamcommunity.com', Origin: 'https://steamcommunity.com' },
								json: true
							};
							//--------- Getting favorites begin -----------
							if (config.favorites == true) { 
								community.httpRequestPost(
									'https://steamcommunity.com/sharedfiles/favorite', optionsFavorite,
									function (err, res, data) {
										if (err) {
											console.log('[%s] Favorite request successfuly sent'.gray, logOnOptions.accountName); sentFavorites++; allSentFavorites++;
											
										}
										if (!err) {
											console.log('[%s] Favorite request successfuly sent'.gray, logOnOptions.accountName); sentFavorites++; allSentFavorites++;
											callback();										
										}
										
									},
									"steamcommunity"
								);
							};		
							//--------- Getting favorites end -----------		

							//--------- Getting likes begin -----------						
							if (config.likes == true) {							
								community.httpRequestPost(
									'https://steamcommunity.com/sharedfiles/voteup', optionsLike,
									function (err, res, data) {
										if (err) {
											console.log('err', err); failedLikes++; allFailedLikes++;
										}
										if (!err) {
										 if (data.success == 1) { console.log('[%s] Successfully voted up with response code %s'.green, logOnOptions.accountName, data.success); successLikes++; allSuccessLikes++;}
										 else { console.log('[%s] something went wrong. Response code %s'.red, logOnOptions.accountName, data.success); failedLikes++; allFailedLikes++;}
										callback();
										}
									},
									"steamcommunity"
								);
							}
							//--------- Getting likes end -----------
							
							})();
						}
				});
			}
			// Using limited account with steam guard disabled for favorites:
			if (config.limited == true) {
			
				const logOnOptions = {	accountName: item.split(":")[0], password: item.split(":")[1] };  
		
				community.login({
						"accountName": logOnOptions.accountName,
						"password": logOnOptions.password
				},
				function (err, sessionID, cookies, steamguard, oAuthToken) {
							if (err) { console.log('[%s] Unable to auth (Error: %s)'.red, logOnOptions.accountName, err); callback(); }
							if (!err) {																
								console.log('[%s] Successfully logged on (Session ID: %s)'.yellow, logOnOptions.accountName, sessionID);

								var optionsFavorite = {
									formData: {	id: id,	appid: config.appid, sessionid: sessionID },
									headers: { Cookie: cookies, Host: 'steamcommunity.com', Origin: 'https://steamcommunity.com' },
									json: true
								};
								community.httpRequestPost(
									'https://steamcommunity.com/sharedfiles/favorite', optionsFavorite,
									function (err, res, data) {
										if (err) {
											console.log('[%s] Favorite request successfuly sent'.green, logOnOptions.accountName); sentFavorites++; allSentFavorites++;
											callback()
										}
										if (!err) {
											console.log('[%s] Favorite request successfuly sent'.green, logOnOptions.accountName); sentFavorites++; allSentFavorites++;
											;										
										}
										
									},
									"steamcommunity"
								);		
												
							}
					});
							
			}
			
		}, function(err) {
				if (config.likes == true) console.log('Chunk %s finished: Successfully sent %s rates up and %s failed requests'.white, ii + 1, successLikes, failedLikes);
				if (config.favorites == true) console.log('Chunk %s: Successfuly sent %s favorites request'.gray, ii + 1, sentFavorites);
				if (ii < subbot.length - 1) console.log('Waiting %s ms for the next chunk'.cyan, betweenChunks);
		});
		if (ii < subbot.length) await new Promise(r => setTimeout(r, betweenChunks));
	};
	if (config.likes == true && config.favorites == true) console.log('Successfully sent %s rates up and %s failed requests. Successfuly sent %s favorites request'.black.bgWhite, allSuccessLikes, allFailedLikes, allSentFavorites)
	else if (config.likes == true) console.log('Successfully sent %s rates up and %s failed requests'.black.bgWhite, allSuccessLikes, allFailedLikes)
	else if (config.favorites == true) console.log('Successfuly sent %s favorites request'.black.bgWhite, allSentFavorites);
	
	
})();

