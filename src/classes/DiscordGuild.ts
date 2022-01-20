import { Collection } from "discord.js";

import type DiscordCommand from "./DiscordCommand";
import type DiscordEvent from "./DiscordEvent";
import type DiscordModule from "./DiscordModule";

import type { Snowflake } from "discord.js";

export default class DiscordGuild {
	disabled = false;
	events = new Collection<string, DiscordEvent<any>>();
	commands = new Collection<string, DiscordCommand>();
	modules = new Collection<string, DiscordModule>();
	constructor(public id: Snowflake) {}

	enable() {
		this.disabled = false;
		for (const event of this.events.values()) event.enable();
		for (const command of this.commands.values()) command.enable();
		for (const module of this.modules.values()) module.enable();
	}

	disable() {
		this.disabled = true;
		for (const event of this.events.values()) event.disable();
		for (const command of this.commands.values()) command.disable();
		for (const module of this.modules.values()) module.disable();
	}
}
