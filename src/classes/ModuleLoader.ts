import debug from "debug";
import { Collection } from "discord.js";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

import Command from "./Command";
import Event from "./Event";

import type { Client, Interaction, CacheType } from "discord.js";

export interface ModuleLoaderOptions {
	disallowedChannelMessage: string;
	commandCooldownMessage: string;
}

export default class DiscordModuleLoader {
	disallowedChannelMessage =
		"You're not allowed to execute this command in this channel!";
	commandCooldownMessage =
		"Please wait % seconds before using this command again.";

	commands: Collection<string, Command> = new Collection();
	cooldowns: Collection<string, Collection<string, number>> = new Collection();
	log = debug("Discord-Module-Loader");

	constructor(public client: Client, options?: ModuleLoaderOptions) {
		if (options?.disallowedChannelMessage)
			this.disallowedChannelMessage = options.disallowedChannelMessage;

		if (options?.commandCooldownMessage)
			this.commandCooldownMessage = options.commandCooldownMessage;

		client.on("interactionCreate", this.handleInteraction);
	}

	async loadModule(dir = "modules") {
		dir = resolve(dir);
		if (!existsSync(dir)) return;
	}

	async loadEvents(dir = "events") {
		dir = resolve(dir);
		if (!existsSync(dir)) return;

		const events = (await readdir(dir)).filter(file => file.endsWith(".js")),
			log = this.log.extend(basename(dirname(dir)));

		log("Loading %d events", events.length);

		for (const file of events) {
			const event = (await import(resolve(dir, file))).default;

			if (!(event instanceof Event))
				throw new Error(`Event ${file} is not an Event`);

			this.client.on(event.event, event.listener);
			log("Loaded event %s", event.event);
		}
	}

	async loadCommands(dir = "commands", globalCommands = true) {
		dir = resolve(dir);
		if (!existsSync(dir)) return;

		const commands = (await readdir(dir)).filter(file => file.endsWith(".js")),
			log = this.log.extend(basename(dirname(dir)));

		log("Loading %d commands", commands.length);

		for (const file of commands) {
			const command = (await import(resolve(dir, file))).default;

			console.log(command);

			if (!(command instanceof Command))
				throw new Error(`Command ${file} is not a Command`);
			if (globalCommands) command.global = true;

			this.commands.set(command.name.toLowerCase(), command);
			log("Loaded command %s", command.name);
		}
	}

	async updateSlashCommands() {}

	private async handleInteraction(interaction: Interaction<CacheType>) {
		if (interaction.isCommand() || interaction.isContextMenu()) {
			const command = this.commands.get(interaction.commandName.toLowerCase());
			if (!command) return; //TODO debug or throw error

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
