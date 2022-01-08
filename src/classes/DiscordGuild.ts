import { Collection } from "discord.js";

import BaseClass from "./BaseClass";

import type DiscordCommand from "./DiscordCommand";
import type DiscordEvent from "./DiscordEvent";
import type DiscordModule from "./DiscordModule";

import type { Snowflake } from "discord.js";

export default class DiscordGuild extends BaseClass {
	events = new Collection<string, DiscordEvent<any>>();
	commands = new Collection<string, DiscordCommand>();
	modules = new Collection<string, DiscordModule>();
	constructor(public id: Snowflake) {
		super();
	}
}
