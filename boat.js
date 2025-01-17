const fs = require("fs");
const path = require("path");
const discord = require("discord.js");
console.log("Botstion 4: A modular bot for Discord. Licenced under GPL 3.0 (see https://www.gnu.org/licenses/)")

const config = require("./util/configLoader")

const client = new discord.Client({autoReconnect:true});
global.client = client
client.meta = {
	name: "Botstion 4",
	devs: ["theLMGN", "SunburntRock89"],
	git : "https://github.com/thelmgn/botstion",
}
//client.on("debug",console.log)

const plugins = [];

function scanFolder(folder) {
	var a = []
	var level = fs.readdirSync(folder)
	for (var file of level) {
		var j = path.join(folder, file)
		if (file.endsWith(".js")) {
			a.push(j)
		}
		if (fs.statSync(j).isDirectory()) {
			a = a.concat(scanFolder(j))
		}
	}
	return a

}

var pluginLoadEvent = new Promise(function(a,r) {
	var items = scanFolder("./plugins")

	console.log(`Read plugins folders and found ${items.length} plugins.`);
	for (var plugin of items) {
		console.log(`	Loading ${plugin}`);
		try {
			var pluginf = require("./" + plugin);
			var shouldLoad = false;
			if (pluginf.requiresConfig) {
				if (config[pluginf.requiresConfig]) {
					if (config[pluginf.requiresConfig] == "") {
						shouldLoad = `it requires the config value ${pluginf.requiresConfig}`
					} else {
						shouldLoad = true
					}
				} else {
					shouldLoad = `it requires the config value ${pluginf.requiresConfig}`
				}
			} else {
				shouldLoad = true
			}
			if (pluginf.disable) {
				shouldLoad = "it's disabled"
			}
			if (shouldLoad == true) {
				console.log(`		Loaded ${pluginf.name} v${pluginf.version} by ${pluginf.author}`);
				plugins.push(pluginf);
			} else {
				console.error(`		Refusing to load ${pluginf.name} v${pluginf.version} by ${pluginf.author} because ${shouldLoad}`);
			}
			
		} catch(err) {
			console.error(`${plugin} experienced an error whilst loading`)
			console.error(err)
			console.error(`Skipping over ${plugin}..`)
		}
		
	}
	console.log("Adding addons.")
	for (var plugin of plugins) {
		if (plugin.addons) {
			for (var addon in plugin.addons) {
				console.log("	Adding addon " + addon + " from plugin " + plugin.name)
				client[addon] = plugin.addons[addon]
			}
		}
	}
	a(plugins)
})

client.on("ready", async () => {
	client.user.setPresence({ activity: { name: `Botstion is loading plugins...` }, status: "away" });
	console.log(`Connected to Discord.`);
	var plugins = await pluginLoadEvent
	client["plugins"] = plugins
	const commandhandler = require("./plugins/commandhandler");
	console.log(`Loaded commandhandler (${commandhandler.name} v${commandhandler.version})`);
	console.log(`Sending ${plugins.length} and client plugins to the commandhandler`);
	commandhandler.init(plugins, client);
	console.log("Assigining events");
	for (var plugin of plugins) {
		if (plugin.events) {
			for (var event of plugin.events) {
				console.log(`Giving ${plugin.name} the ${event.name} event`);
				client.on(event.name, event.exec);
				if (event.name == "ready") {
					event.exec(client)
				}
			}
		}
	}
	console.log("Setting up timer...");
	setInterval(() => {
		for (var plugin of plugins) {
			if (plugin.timer) {
				for (var timerHandler of plugin.timer) {
					timerHandler(client);
				}
			}
		};
	}, 10000);
	client.user.setPresence({ activity: { name: `Loaded ${plugins.length} plugins successfully!` }, status: "online" });
});

client.on("error", (e) => {
	console.error(e)
	process.exit(-1)
})
process.setUncaughtExceptionCaptureCallback(async (e) => {
	console.error(e)
	try {
		var stack = (e.stack || e.toString())
		if (stack.length > 1950) {
			stack = stack.substr(0,1950)
		}
		(await client.channels.fetch(config.errorReportChannel)).send({ embed: new discord.MessageEmbed()
		   .setAuthor("Uncaught exception, somewhere!", "https://cdn.discordapp.com/attachments/423185454582464512/425761155940745239/emote.png")
		   .setColor("#ff3860")
		   .setDescription('```' + stack + '```') });
   }catch(e){console.error(e)}
})

client.login(config.token);
