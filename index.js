const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const Colors = require('colors');
const path = require("path");
const async = require('async');
const fs = require("fs");

const community = new SteamCommunity();

let botsText = fs.readFileSync("./bots.txt").toString('utf-8');
const bots = botsText.split("\n")
const config = require('./config');
const { id, perChunk, betweenChunks } = config;
console.log(`Loaded steam content ID: ${id}`.gray);

let allSuccessLikes = 0;
let allFailedLikes = 0;
let allSentFavorites = 0;

(async() => {
	// Getting chunks:
    let subbot = []; 
	if (config.amount != 0) bots.length = config.amount;
	for (let i = 0; i <Math.ceil(bots.length/perChunk); i++) subbot[i] = bots.slice((i*perChunk), (i*perChunk) + perChunk);
	
	console.log(`There are a total of ${bots.length} accounts and ${subbot.length} chunks`.cyan);
	console.log(`Likes: ${config.likes}, Favorites: ${config.favorites}. Indicated APPID: ${config.appid}`.cyan);
	if (config.limited ==true)
		console.log(`You've set LIMITED accounts. Use this format in the BOTS.TXT:`.black.bgWhite + `login:password:`.blue.bgWhite + `(with the colon in the end of lines)`.black.bgWhite);
	for (let ii = 0; ii < subbot.length; ii++) {
		
		let successLikes = 0;
		let failedLikes = 0;	
		let sentFavorites = 0;	

		async.each(subbot[ii], function(item, callback){
			if (config.limited == false) {
				const logOnOptions = {
					accountName: item.split(":")[0],
					password: item.split(":")[1],
					twoFactorCode: SteamTotp.generateAuthCode(item.split(":")[2]),
				};
				community.login({
					"accountName": logOnOptions.accountName,
					"password": logOnOptions.password,
					"twoFactorCode": logOnOptions.twoFactorCode
				}, async function (err, sessionID, cookies, steamguard, oAuthToken) {
					if (err){
						console.log(`[${logOnOptions.accountName}] Unable to auth (Error: ${err})`.red);
						failedLikes++;
						allFailedLikes++;
						callback();
					} else {
											
						console.log(`[${logOnOptions.accountName}] Successfully logged on (Session ID:${sessionID})`.yellow);

						const optionsLike = {
							formData: {	id: id,	sessionid: sessionID },
							headers: { Cookie: cookies, Host: 'steamcommunity.com', Origin: 'https://steamcommunity.com' },
							json: true
						};

						const optionsFavorite = optionsLike;
						optionsFavorite.formData.appid = config.appid;
						
						if (config.favorites == true) { 
							community.httpRequestPost('https://steamcommunity.com/sharedfiles/favorite', optionsFavorite,
								function (err, res, data) {
									if(err){
										console.log('[%s] Favorite request successfuly sent'.gray, logOnOptions.accountName);
										sentFavorites++;
										allSentFavorites++;
									}
									console.log(`[${logOnOptions.accountName}] Favorite request successfuly sent`.gray);
									sentFavorites++;
									allSentFavorites++;
									callback();	
									
								},
								"steamcommunity"
							);
						};

						if (config.likes == true) {							
							community.httpRequestPost('https://steamcommunity.com/sharedfiles/voteup', optionsLike,
								function (err, res, data) {
									if (err) return console.log('err', err); failedLikes++; allFailedLikes++;
									if (data.success == 1) {
										console.log(`[${logOnOptions.accountName}] Successfully voted up with response code ${data.success}`.green);
										successLikes++;
										allSuccessLikes++;
									} else {
										console.log(`[${logOnOptions.accountName}] something went wrong. Response code ${data.success}`.red);
										failedLikes++;
										allFailedLikes++;
									}
									callback();
								},
								"steamcommunity"
							);
						}
					}
				});
			}
			
			if (config.limited == true) {
			
				const logOnOptions = {
					accountName: item.split(":")[0],
					password: item.split(":")[1]
				};
		
				community.login({
					"accountName": logOnOptions.accountName,
					"password": logOnOptions.password
				}, function (err, sessionID, cookies, steamguard, oAuthToken) {
						if (err) {
							console.log(`[${logOnOptions.accountName}] Unable to auth (Error: ${err})`.red);
							callback();
						}															
						console.log(`[${logOnOptions.accountName}] Successfully logged on (Session ID: ${sessionID})`.yellow);

						const optionsFavorite = {
							formData: {	id: id,	appid: config.appid, sessionid: sessionID },
							headers: { Cookie: cookies, Host: 'steamcommunity.com', Origin: 'https://steamcommunity.com' },
							json: true
						};

						community.httpRequestPost('https://steamcommunity.com/sharedfiles/favorite', optionsFavorite,
							function (err, res, data) {
								if (err) {
									console.log(`[${logOnOptions.accountName}] Error while sending favourite request (Error: ${err})`.green);
									sentFavorites++;
									allSentFavorites++;
									callback();
								}
								console.log('[%s] Favorite request successfuly sent'.green, logOnOptions.accountName);
								sentFavorites++;
								allSentFavorites++;
								
							},
							"steamcommunity"
						);
					});
							
			}
			
		}, function(err) {
				if (config.likes == true)
					console.log(`Chunk ${ii + 1} finished: Successfully sent ${successLikes} rates up and ${failedLikes} failed requests`.white);
				if (config.favorites == true)
					console.log(`Chunk ${ii + 1}: Successfuly sent ${sentFavorites} favorites request`.gray);
				if (ii < subbot.length - 1)
					console.log(`Waiting ${betweenChunks} ms for the next chunk`.cyan);
		});
		if (ii < subbot.length) await new Promise(r => setTimeout(r, betweenChunks));
	};
	if (config.likes == true && config.favorites == true)
		console.log(`Successfully sent ${allSuccessLikes} rates up and ${allFailedLikes} failed requests. Successfuly sent ${allSentFavorites} favorites request`.black.bgWhite);
	else if(config.likes == true)
		console.log(`Successfully sent ${allSuccessLikes} rates up and ${allFailedLikes} failed requests`.black.bgWhite);
	else if (config.favorites == true)
		console.log(`Successfuly sent ${allSentFavorites} favorites request`.black.bgWhite);
	
	
})();