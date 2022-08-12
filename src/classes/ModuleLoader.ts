import debug from "debug";
import { Collection, Snowflake } from "discord.js";
import { existsSync } from "node:fs";
import { lstat, readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";

import DiscordCommand from "./DiscordCommand";
import DiscordEvent from "./DiscordEvent";
import DiscordGuild from "./DiscordGuild";
import DiscordModule from "./DiscordModule";

import type { Client, Interaction, CacheType } from "discord.js";

export interface ModuleLoaderOptions {
	unknownCommandMessage?: string;
	disabledCommandMessage?: string;
	disallowedChannelMessage?: string;
	commandCooldownMessage?: string;
}

export default class DiscordModuleLoader {
	unknownCommandMessage =
		"Couldn't find executed command. Please try again later, or report the issue.";
	disabledCommandMessage =
		"This command is currently disabled. Please try again later.";
	disallowedChannelMessage =
		"You're not allowed to execute this command in this channel!";
	commandCooldownMessage =
		"Please wait % seconds before using this command again.";

	commands = new Collection<string, DiscordCommand>();
	modules = new Collection<string, DiscordModule>();
	guilds = new Collection<string, DiscordGuild>();
	cooldowns = new Collection<string, Collection<string, number>>();
	log = debug("Discord-Module-Loader");

	constructor(public client: Client, options?: ModuleLoaderOptions) {
		if (options?.unknownCommandMessage)
			this.unknownCommandMessage = options.unknownCommandMessage;

		if (options?.disabledCommandMessage)
			this.disabledCommandMessage = options.disabledCommandMessage;

		if (options?.disallowedChannelMessage)
			this.disallowedChannelMessage = options.disallowedChannelMessage;

		if (options?.commandCooldownMessage)
			this.commandCooldownMessage = options.commandCooldownMessage;

		client.setMaxListeners(Infinity);
		client.on("interactionCreate", int => void this.handleInteraction(int));
	}

	async loadAll() {
		await this.loadCommands();
		await this.loadEvents();
		await this.loadModules();
		await this.loadGuilds();
	}

	async loadGuilds(dir = "guilds") {
		dir = resolve(dir);
		if (!existsSync(dir)) return [];

		const guilds = await readdir(dir),
			log = this.log.extend(basename(dir));

		log("Loading %d guilds modules", guilds.length);

		const returnGuilds: [string, DiscordGuild][] = [];
		for (const folder of guilds) {
			if (!(await lstat(resolve(dir, folder))).isDirectory())
				throw new Error(`${folder} is not a directory.`);

			if (!existsSync(resolve(dir, folder, "index.js")))
				throw new Error(`Couldn't find index.js in ${folder}`);

			let guild = (await import(resolve(dir, folder, "index.js"))).default;

			if (typeof guild === "function") guild = await guild();

			if (!(guild instanceof DiscordGuild))
				throw new Error(`Guild ${folder} is not an Guild.`);

			if (!this.client.guilds.cache.get(guild.id))
				throw new Error(`Guild ${guild.id} is not cached.`);

			if (this.guilds.has(guild.id))
				throw new Error(`Cannot add ${guild.id} more than once.`);

			this.guilds.set(guild.id, guild);
			returnGuilds.push([guild.id, guild]);

			if (existsSync(resolve(dir, folder, "events")))
				this.addToColl(
					guild.events,
					await this.loadEvents(resolve(dir, folder, "events"), guild.id)
				);

			if (existsSync(resolve(dir, folder, "commands")))
				this.addToColl(
					guild.commands,
					await this.loadCommands(resolve(dir, folder, "commands"), guild.id)
				);

			if (existsSync(resolve(dir, folder, "modules")))
				this.addToColl(
					guild.modules,
					await this.loadModules(resolve(dir, folder, "modules"), guild.id)
				);

			if (guild.callback) await guild.callback();

			log("Loaded guild module for guild: %s", guild.id);
		}
		return returnGuilds;
	}

	async loadModules(dir = "modules", guildId?: string) {
		dir = resolve(dir);
		if (!existsSync(dir)) return [];

		const modules = await readdir(dir),
			log = this.log.extend(basename(dir));

		log("Loading %d modules", modules.length);

		const returnModules: [string, DiscordModule][] = [];
		for (const folder of modules) {
			if (!(await lstat(resolve(dir, folder))).isDirectory())
				throw new Error(`${folder} is not a directory.`);

			if (!existsSync(resolve(dir, folder, "index.js")))
				throw new Error(`Couldn't find index.js in ${folder}`);

			let module = (await import(resolve(dir, folder, "index.js"))).default;

			if (typeof module === "function") module = await module();

			if (!(module instanceof DiscordModule))
				throw new Error(`Module ${folder} is not an Module`);

			if (this.modules.has(module.name))
				throw new Error(`Cannot add ${module.name} more than once.`);

			if (existsSync(resolve(dir, folder, "events")))
				this.addToColl(
					module.events,
					await this.loadEvents(resolve(dir, folder, "events"), guildId)
				);

			if (existsSync(resolve(dir, folder, "commands")))
				this.addToColl(
					module.commands,
					await this.loadCommands(resolve(dir, folder, "commands"), guildId)
				);

			if (existsSync(resolve(dir, folder, "modules")))
				this.addToColl(
					module.modules,
					await this.loadModules(resolve(dir, folder, "modules"))
				);

			if (module.callback) await module.callback();

			this.modules.set(module.name, module);
			returnModules.push([module.name, module]);
			log("Loaded module %s", module.name);
		}
		return returnModules;
	}

	private addToColl(coll: Collection<string, any>, add: [string, any][]) {
		for (const [key, value] of add) coll.set(key, value);
	}

	async loadEvents(dir = "events", guildId?: string) {
		dir = resolve(dir);
		if (!existsSync(dir)) return [];

		const events = (await readdir(dir)).filter(file => file.endsWith(".js")),
			log = this.log.extend(basename(dir));

		log("Loading %d events", events.length);

		const returnEvents: [string, DiscordEvent<any>][] = [];
		for (const file of events) {
			let event = (await import(resolve(dir, file))).default;

			if (typeof event === "function") event = await event();

			if (!(event instanceof DiscordEvent))
				throw new Error(`Event ${file} is not an Event`);

			if (guildId) {
				this.guilds.get(guildId)!.events.set(event.event, event);

				event.guildId = guildId;
			}

			this.client.on(event.event, (...args) => {
				if (
					!event.disabled &&
					event.guildId &&
					args[0]?.guild?.id === event.guildId
				)
					event.listener(...args);
				if (!event.disabled && !event.guildId) event.listener(...args);
			});

			returnEvents.push([event.event, event]);
			log("Loaded event %s", event.event);
		}
		return returnEvents;
	}

	async loadCommands(
		dir = "commands",
		guildId?: Snowflake,
		subDirectoryOf?: string
	) {
		dir = resolve(dir);
		if (!existsSync(dir)) return [];

		const directory = await readdir(dir, { withFileTypes: true }),
			commands = directory
				.filter(file => file.isFile() && file.name.endsWith(".js"))
				.map(f => f.name),
			subDirectories = directory
				.filter(file => file.isDirectory())
				.map(f => f.name),
			log = subDirectoryOf
				? this.log.extend(subDirectoryOf).extend(basename(dir))
				: this.log.extend(basename(dir));

		log("Loading %d commands", commands.length);

		const returnCommands: [string, DiscordCommand][] = [];
		for (const file of commands) {
			let discordCommand = (await import(resolve(dir, file))).default;

			if (typeof discordCommand === "function")
				discordCommand = await discordCommand();

			if (!(discordCommand instanceof DiscordCommand))
				throw new Error(`Command ${file} is not a Command`);

			if (this.commands.has(discordCommand.command.name.toLowerCase()))
				throw new Error(
					`Cannot add ${discordCommand.command.name} more than once.`
				);

			if (guildId) {
				this.guilds
					.get(guildId)!
					.commands.set(
						discordCommand.command.name.toLowerCase(),
						discordCommand
					);

				discordCommand.guildId = guildId;
			}

			this.commands.set(
				discordCommand.command.name.toLowerCase(),
				discordCommand
			);
			returnCommands.push([
				discordCommand.command.name.toLowerCase(),
				discordCommand
			]);
			log("Loaded command %s", discordCommand.command.name);
		}

		if (!subDirectoryOf) {
			log("Loading %s sub-directories", subDirectories.length);
			for (const subDirectory of subDirectories)
				returnCommands.push(
					...(await this.loadCommands(
						resolve(dir, subDirectory),
						guildId,
						basename(dir)
					))
				);
		}

		return returnCommands;
	}

	async updateSlashCommands() {
		if (!this.client.isReady()) throw new Error("Client is not ready.");

		const localGlobalCommands = this.commands.filter(c => !c.guildId),
			log = this.log.extend("SlashCommands");

		log("Setting %d global commands...", localGlobalCommands.size);
		await this.client.application.commands.set(
			localGlobalCommands.map(c => c.command)
		);

		for (const [id, guild] of this.client.guilds.cache) {
			const dGuild = this.guilds.get(id);

			if (dGuild?.commands.size)
				log(
					"Setting %d commands for guild %s...",
					dGuild.commands.size,
					guild.name
				);

			await guild.commands.set(dGuild?.commands.map(c => c.command) ?? []);
		}
	}

	private async handleInteraction(interaction: Interaction<CacheType>) {
		if (interaction.isAutocomplete()) {
			const command = this.commands.get(interaction.commandName.toLowerCase());

			if (!command) return await interaction.respond([]);

			try {
				await command.execute(interaction);
			} catch (err) {
				console.error(err);
			}
		}

		if (
			interaction.isCommand() ||
			interaction.isContextMenuCommand() ||
			interaction.isChatInputCommand() ||
			interaction.isUserContextMenuCommand()
		) {
			const discordCommand = this.commands.get(
				interaction.commandName.toLowerCase()
			);
			if (!discordCommand)
				return await interaction.reply({
					content: this.unknownCommandMessage,
					ephemeral: true
				});

			if (discordCommand.disabled)
				return await interaction.reply({
					content: this.disabledCommandMessage,
					ephemeral: true
				});

			let allowed = true;
			if (
				discordCommand.channelDenylist &&
				discordCommand.channelDenylist.includes(interaction.channelId)
			)
				allowed = false;
			else if (
				discordCommand.channelAllowlist &&
				!discordCommand.channelAllowlist.includes(interaction.channelId)
			)
				allowed = false;

			if (!allowed) {
				if (!this.disallowedChannelMessage.length) return;

				return await interaction.reply({
					content: this.disallowedChannelMessage,
					ephemeral: true
				});
			}

			if (discordCommand.cooldown) {
				if (!this.cooldowns.has(discordCommand.command.name))
					this.cooldowns.set(discordCommand.command.name, new Collection());
				const timestamps = this.cooldowns.get(discordCommand.command.name)!;
				if (timestamps.has(interaction.user.id)) {
					const expirationTime =
						timestamps.get(interaction.user.id)! +
						discordCommand.cooldown * 1000;
					if (Date.now() < expirationTime) {
						return await interaction.reply({
							content: this.commandCooldownMessage.replace(
								"%",
								Math.ceil((expirationTime - Date.now()) / 1000).toString()
							),
							ephemeral: true
						});
					}
				}

				timestamps.set(interaction.user.id, Date.now());
				setTimeout(
					() => timestamps.delete(interaction.user.id),
					discordCommand.cooldown * 1000
				);
			}

			try {
				await discordCommand.execute(interaction);
			} catch (err) {
				console.error(err);
			}
		}
	}
}
