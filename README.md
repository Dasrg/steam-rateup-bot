<h1>Steam rate up bot</h1>

Bot for like and favorite steam screenshotes, artworks, guides, videos, workshop items.

[![GitHub followers](https://img.shields.io/github/followers/Dasrg?label=Follow&style=social)](https://github.com/Dasrg)
[![streamlabs](https://img.shields.io/badge/Donate-%241-red)](https://streamlabs.com/das-Dme6dF/tip)
[![nodejs](https://img.shields.io/badge/node.js-v12-brightgreen)](https://nodejs.org/)

<b>Installing:</b>
1. Install <a href="https://nodejs.org/">Node.js LTS version</a>
2. Download this repo (click `Code -> Download ZIP`) and unpack the archive.
3. Open command prompt or PowerShell in the bot folder (`Shift + Right Click`, or `cd 'path to the bot'`)
4. Type `npm i` or `npm install`

<b>Using:</b>
1. Add to the `bot.txt` textfile accounts login data (`login:password:shared_secret` in the each line). Your need to use steam accounts without any restrictions ($5 spend).
2. In the `config.json` set id of the content (your content link: "steamcommunity.com/sharedfiles/filedetails/?id=<b>XXXXXXXXXXX"</b>, enter in the config <b>XXXXXXXXXXX</b>). Set the `perChunk` and `betweenChunks` parameters. If you want to favorite count boost set `"favorites": true` and enter `appid` (for CS:GO Artworks `"appid": 767`).
You can use limited steam accounts with Steam Guard disabled `"limited": false`. <b>Attention:</b> in this case format of `bots.txt`: `login:password:` (with colon in the end of each line).
`amount` parameter is number of likes/favorites. If `amount: 0` bot use amount of steam accounts in the `bots.txt`.

Config example:
```
{
	"id": "2164876148",
	"perChunk": 3,
	"betweenChunks": 15000,
	"amount": 0,
	"likes": true,
	"favorites": false,
	"appid": "730",
	"limited": false
}
```

3. Run the bot - type in the command prompt or PowerShell: `node index.js`

<h2>FAQ:</h2>

- I get an error when trying `npm install`

  - You need to use Node.js LTS version which is recommended for most users
  
- I got this error: `[Login] Unable to auth (Error: Error: SteamGuardMobile...`
 
  - This may appear when you enter the `shared_secret` incorrectly in the `bots.txt` texfile. And also this may mean that you have too many tries to auth (decrease the `perChunk` value in the `config.json`)
  
- I got this error: `[Login] Unable to auth (Error: Error: HTTP error 429...`
 
  - This error apears when you have too many tries to auth (decrease the `perChunk` value in the `config.json`)
 
- I got this error: `[Login] Something went wrong. Response code 112`

  - This account has steam community restricton. You need to use unlimited accounts. <a href="https://support.steampowered.com/kb_article.php?ref=3330-iagk-7663">Check more info</a>
