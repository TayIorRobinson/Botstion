const Discord = require("discord.js");
const fetch = require("node-fetch");

async function getPost(search,allowNSFW,index) {
    return new Promise(async function(a,r) {
        if (index > 1) {
            return a("Couldn't find a suitable post ")
        }
        var ftch = await fetch("https://e621.net/posts.json?limit=1&tags=" + encodeURIComponent(search), {headers: {"User-Agent": "Botstion/4.0 (https://github.com/thelmgn/Botstion, mailto:leo@thelmgn.com)"}})
        var j = (await ftch.json()).posts[0]
        if (!j) {
            return a("No posts returned.")
        }
        if (!allowNSFW && j.rating != "s") {
            return setTimeout(function() {
                a(getPost(search,allowNSFW,(index ? index + 1 : 1)))
            },1000)
        }
        // Join tags in a certain order.
        var tags = j.tags.artist.concat(j.tags.copyright.concat(j.tags.lore.concat(j.tags.character.concat(j.tags.lore.concat(j.tags.species.concat(j.tags.general))))))
        if (tags.includes("gore") || tags.includes("scat") || tags.includes("young") ||  tags.includes("loli") || tags.includes("shota") || tags.includes("cub")) {
            return setTimeout(function() {
                a(getPost(search,allowNSFW,(index ? index + 1 : 1)))
            },1000)
        }
        j.tagss = tags
        a(j)
    })
}

module.exports = {
	name: "e621.net",
	author: "(not) theLMGN",
	version: 1,
	description: "Grabs images from e621",
	commands: [
		{
			name: "e621",
			usage: "word[] optional searchQuery=fluffy",
            description: "Grabs a random image from e621.net (will only grab safe images in SFW channels)",
            category: "NSFW",
            stipulations: {
                nsfw: 1,
            },
            /**
             * @param c {Discord.Client}
             * @param m {Discord.Message}
             * @param a {Array}
             */
			execute: async(c, m, a) => {
                a = a.searchQuery || []
                if (a == "fluffy") a = []
                a.unshift("order:random")
                // Remove some tags that Discord might not like 
                a.unshift("-gore")
                a.unshift("-scat")
                a.unshift("-young")
                a.unshift("-loli")
                a.unshift("-shota")
                a.unshift("-cub")
                a.unshift("-death")
                a.unshift("-type:swf")
                a.unshift("-type:webm")
                var allowNSFW = m.channel.nsfw || !m.channel.guild
                if (!allowNSFW) {
                    a.unshift("rating:s")
                }

                var j = await getPost(a.join(" "),allowNSFW)
                if (typeof j == "string") {
                    return m.reply(j)
                }
                var tags = j.tagss
                var tagString = tags.join(" ").substr(0,1900)
                if (tagString.length > 1899) {
                    var s = tagString.split(" ")
                    s.pop()
                    tagString = s.join(" ")
                }
                return m.reply(new Discord.MessageEmbed()
                        .setTitle("#" + j.id + " " + j.fav_count + "❤️ " + j.score.total + "⬆️")
                        .setDescription(tagString.replace(/_/g,"\\_"))
                        .setImage(j.file.url)
                        .setURL("https://e621.net/posts/" + j.id)
                        .setColor("#284a81")
                        .setFooter("Command invoked by " + m.author.username, m.author.avatarURL()))
            }
        }
	]
};
