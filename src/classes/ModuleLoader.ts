import debug from "debug";
import { Collection, Snowflake } from "discord.js";
import { existsSync } from "node:fs";
import { lstat, readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";

import DiscordCommand from "./DiscordCommand";
import DiscordEvent from "./DiscordEvent";
import DiscordGuild from "./DiscordGuild";
import DiscordModule from "./DiscordModule";

import type {
	Client,
	Interaction,
	CacheType,
	UserApplicationCommandData,
	ChatInputApplicationCommandData,
	ApplicationCommand
} from "discord.js";

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
		client.on("interactionCreate", int => this.handleInteraction(int));
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

			const guild = (await import(resolve(dir, folder, "index.js"))).default;

			if (!(guild instanceof DiscordGuild))
				throw new Error(`Guild ${folder} is not an Guild.`);

			//* Guild disabled, continue
			if (guild.disabled) continue;

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

			const module = (await import(resolve(dir, folder, "index.js"))).default;

			if (!(module instanceof DiscordModule))
				throw new Error(`Module ${folder} is not an Module`);

			//* Module disabled, continue
			if (module.disabled) continue;

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
			const event = (await import(resolve(dir, file))).default;

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
			const command = (await import(resolve(dir, file))).default;

			if (!(command instanceof DiscordCommand))
				throw new Error(`Command ${file} is not a Command`);

			if (this.commands.has(command.name.toLowerCase()))
				throw new Error(`Cannot add ${command.name} more than once.`);

			if (guildId) {
				this.guilds
					.get(guildId)!
					.commands.set(command.name.toLowerCase(), command);

				command.guildId = guildId;
			}

			this.commands.set(command.name.toLowerCase(), command);
			returnCommands.push([command.name.toLowerCase(), command]);
			log("Loaded command %s", command.name);
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
		const globalCommands = await this.client.application.commands.set(
			localGlobalCommands
				.map(c => {
					if (c.hasUserCommand)
						return [
							this.convertToGlobalCommand(c),
							this.convertToUserCommand(c)
						];
					return [this.convertToGlobalCommand(c)];
				})
				.flat()
		);

		for (const [id, guild] of this.client.guilds.cache) {
			const commands: [ApplicationCommand<{}>, DiscordCommand][] =
					globalCommands
						.map((c): [ApplicationCommand<{}>, DiscordCommand] => [
							c,
							localGlobalCommands.find(
								g => g.name.toLowerCase() === c.name.toLowerCase()
							)!
						])
						.filter(c => !!c[1].permissions),
				dGuild = this.guilds.get(id);

			if (dGuild?.commands.size)
				log(
					"Setting %d commands for guild %s...",
					dGuild.commands.size,
					guild.name
				);

			const gCommands = await guild.commands.set(
				dGuild?.commands
					.map(c => {
						if (c.hasUserCommand)
							return [
								this.convertToGlobalCommand(c),
								this.convertToUserCommand(c)
							];
						return [this.convertToGlobalCommand(c)];
					})
					.flat() ?? []
			);

			commands.push(
				...gCommands
					.map((c): [ApplicationCommand<{}>, DiscordCommand] => [
						c,
						dGuild?.commands.find(
							c => c.name.toLowerCase() === c.name.toLowerCase()
						)!
					])
					.filter(c => !!c[1].permissions)
			);

			if (commands.length) {
				log(
					"Setting permissions for %d commands in guild %s...",
					commands.length,
					guild.name
				);
				await guild.commands.permissions.set({
					fullPermissions: commands.map(c => ({
						id: c[0].id,
						permissions: c[1].permissions!
					}))
				});
			}
		}
	}

	private convertToUserCommand(
		command: DiscordCommand
	): UserApplicationCommandData {
		return {
			name: `${command.name.charAt(0).toUpperCase()}${command.name.slice(1)}`,
			defaultPermission: command.defaultPermission,
			type: "USER"
		};
	}

	private convertToGlobalCommand(
		command: DiscordCommand
	): ChatInputApplicationCommandData {
		return {
			name: command.name,
			options: command.options,
			description: command.description,
			defaultPermission: command.defaultPermission,
			type: "CHAT_INPUT"
		};
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

		if (interaction.isCommand() || interaction.isContextMenu()) {
			const command = this.commands.get(interaction.commandName.toLowerCase());
			if (!command)
				return await interaction.reply({
					content: this.unknownCommandMessage,
					ephemeral: true
				});

			if (command.disabled)
				return await interaction.reply({
					content: this.disabledCommandMessage,
					ephemeral: true
				});

			let allowed = true;
			if (
				command.channelDenylist &&
				command.channelDenylist.includes(interaction.channelId)
			)
				allowed = false;
			else if (
				command.channelAllowlist &&
				!command.channelAllowlist.includes(interaction.channelId)
			)
				allowed = false;

			if (!allowed) {
				if (!this.disallowedChannelMessage.length) return;

				return await interaction.reply({
					content: this.disallowedChannelMessage,
					ephemeral: true
				});
			}

			if (command.cooldown) {
				if (!this.cooldowns.has(command.name))
					this.cooldowns.set(command.name, new Collection());
				const timestamps = this.cooldowns.get(command.name)!;
				if (timestamps.has(interaction.user.id)) {
					const expirationTime =
						timestamps.get(interaction.user.id)! + command.cooldown * 1000;
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
					command.cooldown * 1000
				);
			}

			try {
				await command.execute(interaction);
			} catch (err) {
				console.error(err);
			}
		}
	}
}
