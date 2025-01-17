const Discord = require("discord.js");
const config = require("../../util/configLoader");
const fetch = require("node-fetch");
let lastRequest = {};
var queue = []
var langs
var versions

async function doQueue() {
	var item = queue.shift()
	if (!item) return;
	console.log("[Piston] Doing queue item",item)
	if (item.e.deleted) return doQueue();
	var f = await fetch("https://emkc.org/api/v1/piston/execute",{
		method: "POST",
		body: JSON.stringify({
			language: item.l,
			source: item.code
		})
	})
	var j = await f.json()
	if (j.message) {
		return item.e.edit({ embed: new Discord.MessageEmbed()
			.setTitle(j.message)
			.setColor("#ff3860") });
	}
	return item.e.edit({ embed: new Discord.MessageEmbed()
		.setTitle(j.language + " v" +j.version )
		.setDescription("```\n" +j.output + "\n```" )
		.setColor("#23d160") });

}

module.exports = {
	name: "Piston Code Executor",
	author: "theLMGN",
	version: 1,
	description: "Execute code using Piston",
	commands: [
		{
			name: "exec",
			usage: "word[] code=```js\nconsole.log('hello')\n```",
			description: "Execute code in different languages",
			aliases: ["piston"],
			category: "Utilities",
			execute: async(c, m, a) => {
				if (!versions) {
					return m.reply({ embed: new Discord.MessageEmbed()
						.setTitle("Please wait")
						.setDescription(`Please wait a minute before retrying your command`)
						.setColor("#3273dc") });
				}
				a.code = m.content.split(" ")
				a.code.shift()
				a.code = a.code.join(" ").replace(/```/g,"")
				var s= a.code.split("\n")
				var l = s.shift()
				var code = s.join("\n")
				if (!langs.includes(l)) {
					return m.reply({ embed: new Discord.MessageEmbed()
						.setTitle("Unknown language")
						.setDescription("Valid languages are " + versions.map((l) => `\`${l.name}\``).join(",") + "\nEnter code like so:\n\\`\\`\\`js\nconsole.log(\"Hello, world!\")\n\\`\\`\\`")
						.setColor("#ff3860") });
				}
				var e = await m.reply({ embed: new Discord.MessageEmbed()
					.setTitle("Enqueued...")
					.setDescription(`This should only take a few seconds.`)
					.setColor("#ffdd57") });
				queue.push({e,code,l})
				return e
			}
		}
	],
	events: [
		{
			name: "ready",
			exec: async function(c) {
				var f = await fetch("https://emkc.org/api/v1/piston/versions")
				versions = await f.json()
				langs = []
				for (var v of versions) {
					langs.push(v.name,...v.aliases)
				}
				setInterval(doQueue,200)
			}
		}
	]
	
};
