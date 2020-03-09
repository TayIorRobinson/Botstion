const config = require("../../configLoader");
const Discord = require("discord.js");
module.exports = {
	name: "Evaluate Code",
	author: "SunburntRock89",
	version: 2,
	description: "Evaluates code from a message.",
	commands: [{
		name: "eval",
		usage: "word[] code=console.log(\"Hello World!\")",
		description: "Executes some code.",
		/**
		 * 
		 * @param {Discord.Client} c 
		 * @param {Discord.Message} m 
		 * @param {Object} a 
		 */
		execute: async(c, m, a) => {
			if (config.maintainers.includes(m.author.id)) {
				try {
					var s = m.content.split(" ")
					s.shift()
					var cntnt = s.join(" ")
					let result = await eval(`(async function() {return ${cntnt.replace("c.token", "").replace("client.token", "").replace("[\"token\"]", "")}})()`);
					var str = result.toString()
					try {
						str = JSON.stringify(result,null,1)
					} catch(e) {}
					console.log(result,str)
					if (result && !str) {
						if (typeof result.toString == "function") {
							str = result.toString()
						} else {
							str = "*I have no idea what to do with this " + typeof result + "*"
						}
					}
					if (!result) {
						result = "undefined"
					}
					str = str.replace(eval(`/${config.token}/g`), "no");
					if (str.length > 1990) {
						return m.reply([new Discord.MessageEmbed().setTitle(`Evaluation Result`)
						.setFooter("Limited to first 1990 characters")
						.setDescription("```json\n" +str.substring(0,1990) + "```")
						.setColor("#FFCA28"),new Discord.MessageAttachment(Buffer.from(str),`Eval-${new Date()}.txt`)])
					} else {
						return m.reply(new Discord.MessageEmbed().setTitle(`Evaluation Result`)
						.setDescription("```json\n" +str + "```")
						.setColor("#FFCA28"))
					}
					
				} catch (err) {
					return m.reply(`Woops, we had an error.\n\`\`\`${err}\`\`\``);
				}
			} else {
				m.reply({ embed: new Discord.MessageEmbed()
					.setAuthor("401: Access denied.", "https://cdn.discordapp.com/attachments/423185454582464512/425761155940745239/emote.png")
					.setColor("#ff3860")
					.setFooter(`You do not have permissions to run this command. Sorry.`) });
			}
		},
	}]
};
