import { Collection } from "discord.js";

import type DiscordCommand from "./DiscordCommand";
import type DiscordEvent from "./DiscordEvent";

export default class DiscordModule {
	disabled = false;
	events = new Collection<string, DiscordEvent<any>>();
	commands = new Collection<string, DiscordCommand>();
	modules = new Collection<string, DiscordModule>();

	constructor(
		public name: string,
		public callback?: () => any,
		options?: { disabled: boolean }
	) {
		if (options?.disabled) this.disable();
	}

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
