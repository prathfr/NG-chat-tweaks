/// <reference types="..\\node_modules\\@latitescripting\\latiteapi\\definitions"/>
// @ts-check
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const mod = new Module("ngtweaks", "NG Tweaks", "NetherGames Tweaks", 0);


const http = require("http");
const Globals = require("./globals.js");


var cacheOwnStats = mod.addBoolSetting("cacheOwnStats", "Cache Own Stats", "Cache your own stats", true);
var maxCacheTime = mod.addNumberSetting("maxCacheTime", "Max Cache Time (mins)", "Max time (in mins) before cached stats are refreshed", 1, 60, 1, 30);


var playerCache = {};


function getTeam(teamColor, playerCount) {
    if (Globals.acceptablePlayerCounts.includes(Number(
        playerCount.substring(playerCount.indexOf('/') + 3, playerCount.length - 3)
    ))) {
        const color = teamColor.charAt(1);
        return `\u00A7${color}\u00A7l${Globals.teamColors[color]} \u00A7r\u00A7${color}`
    } else {
        return teamColor
    }
}

function getPrintStr(name, team, playerCount, extra) {
    if (playerCache[name]["nicked"]) {
        return "{team}{name} \u00A7ehas joined {playerCount}! \u00A7r\u00A7cNicked\u00A7r{extra}"
                .replace("{team}", getTeam(team, playerCount))
                .replace("{name}", name)
                .replace("{playerCount}", playerCount)
                .replace("{extra}", extra)
    } else {
        return "{level} {tier}{rank}{team}{name} {guild}\u00A7r({kdr}) \u00A7ehas joined {playerCount}!{extra}"
                .replace("{level}", playerCache[name]["level"])
                .replace("{tier}", playerCache[name]["tier"] ? Globals.tierUnicodes[playerCache[name]["tier"].toLowerCase()] + ' ' : '')
                .replace("{rank}", playerCache[name]["ranks"].length > 0 ? Globals.rankUnicodes[playerCache[name]["ranks"][0].toLowerCase()] + ' ' : '')
                .replace("{team}", getTeam(team, playerCount))
                .replace("{name}", name)
                .replace("{guild}", playerCache[name]["guild"])
                .replace("{kdr}", playerCache[name]["kdr"])
                .replace("{playerCount}", playerCount)
                .replace("{extra}", extra)
    }
}


client.on("receive-chat", (event) => {

    // if (mod.isEnabled()) {
    if (true) {

        // if (world.getName().toLowerCase().includes("nethergames")) {
        if (world.getName().toLowerCase().includes("nethergames") || !game.getServer()) {

            const mesg = Globals.fixFormat(event.message);
            const startIndex = mesg.indexOf(" \u00A7ehas joined ");

            if (startIndex != -1) {

                event.cancel = true;

                const start_time = Date.now();

                const teamColor = mesg.substring(0, 2);
                const playerName = mesg.substring(2, startIndex);
                const playerCount = "\u00A7e" + mesg.substring(startIndex + 14, mesg.length - 1);

                var send_new_api_req = true;

                if (playerName in playerCache) {
                    // @ts-ignore
                    if (playerName != game.getLocalPlayer().getName() || cacheOwnStats.getValue()) {
                        if (playerCache[playerName]["cacheTime"] > Date.now() - maxCacheTime.getValue() * 60000) {
                            send_new_api_req = false;
                            clientMessage(getPrintStr(playerName, teamColor, playerCount, " \u00A7r\u00A77(Cached)"));
                        }
                    }
                }

                if (send_new_api_req) {

                    // @ts-ignore
                    http.getAsync(`https://api.ngmc.co/v1/players/${playerName.split(' ').join("%20")}${Globals.getQueryParams()}`, {}, (resp) => {

                        const exec_time = Date.now() - start_time;

                        if (resp.statusCode == 404) {

                            playerCache[playerName] = {
                                "nicked": true,
                                "cacheTime": Date.now(),
                            };

                            clientMessage(getPrintStr(playerName, teamColor, playerCount, ` \u00A7r\u00A77(${exec_time / 1000}s)`));
                            
                        } else if (resp.statusCode == 200) {

                            const r = JSON.parse(util.bufferToString(resp.body));

                            var guild_tag = '';
                            if (r["guildData"]) {
                                if (r["guildData"]["rawTag"]) {
                                    guild_tag = `\u00A7r\u00A7l${Globals.fixFormat(r["guildData"]["rawTag"])}\u00A7r `;
                                } else {
                                    guild_tag = `\u00A7r[${r["guildData"]["name"]}] `;
                                }
                            }

                            playerCache[playerName] = {
                                "nicked": false,
                                "cacheTime": Date.now(),
                                "level": Globals.fixFormat(r["formattedLevel"] + "\u00A7r"),
                                "guild": guild_tag,
                                "kdr": r["kdr"],
                                "tier": r["tier"],
                                "ranks": r["ranks"]
                            };

                            clientMessage(getPrintStr(playerName, teamColor, playerCount, ` \u00A7r\u00A77(${exec_time / 1000}s)`));

                        } else {

                            clientMessage(`${mesg} \u00A7r\u00A77(\u00A7cNG API Error ${resp.statusCode}\u00A7r, \u00A77${exec_time / 1000}s)`);

                        }

                    });

                }

            }

        }

    }

});


client.getModuleManager().registerModule(mod);


// §bPrathpro17 §ehas joined (§b5§e/§b12§e)!
