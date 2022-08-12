import BaseClass from "./BaseClass";

import type {
	ApplicationCommandPermissions,
	Awaitable,
	Snowflake,
	Interaction,
	ApplicationCommandData
} from "discord.js";

export default class DiscordCommand extends BaseClass {
	guildId?: Snowflake;
	command: ApplicationCommandData;
	channelAllowlist?: Snowflake[];
	channelDenylist?: Snowflake[];
	cooldown?: number;
	execute: (interaction: Interaction) => Awaitable<any>;

	constructor(options: CommandOptions) {
		super();
		this.command = options.command;
		this.channelAllowlist = options.channelAllowlist;
		this.channelDenylist = options.channelDenylist;
		this.cooldown = options.cooldown;
		this.execute = options.execute;
	}
}

export interface CommandOptions {
	command: ApplicationCommandData;
	permissions?: ApplicationCommandPermissions[];
	channelAllowlist?: Snowflake[];
	channelDenylist?: Snowflake[];
	cooldown?: number;
	execute(interaction: Interaction): Awaitable<any>;
}
