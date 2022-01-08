import { Collection } from "discord.js";

import BaseClass from "./BaseClass";

import type DiscordCommand from "./DiscordCommand";
import type DiscordEvent from "./DiscordEvent";

export default class DiscordModule extends BaseClass {
	events = new Collection<string, DiscordEvent<any>>();
	commands = new Collection<string, DiscordCommand>();
	modules = new Collection<string, DiscordModule>();
	constructor(public name: string) {
		super();
	}
}
