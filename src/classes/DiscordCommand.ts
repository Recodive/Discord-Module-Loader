import BaseClass from "./BaseClass";

import type {
	ApplicationCommandOptionData,
	ApplicationCommandPermissionData,
	Awaitable,
	ChatInputApplicationCommandData,
	CommandInteraction,
	Snowflake,
	ContextMenuInteraction,
	AutocompleteInteraction
} from "discord.js";

export default class DiscordCommand extends BaseClass {
	guildId?: string;
	name: string;
	description: string;
	defaultPermission?: boolean;
	options?: ApplicationCommandOptionData[];
	cooldown?: number;
	channelAllowlist?: Snowflake[];
	channelDenylist?: Snowflake[];
	permissions?: ApplicationCommandPermissionData[];
	hasUserCommand?: boolean;
	execute: (
		interaction:
			| CommandInteraction
			| ContextMenuInteraction
			| AutocompleteInteraction
	) => Awaitable<void>;

	constructor(options: CommandOptions) {
		super();
		this.name = options.name;
		this.description = options.description;
		this.defaultPermission = options.defaultPermission;
		this.options = options.options;
		this.cooldown = options.cooldown;
		this.channelAllowlist = options.channelAllowlist;
		this.channelDenylist = options.channelDenylist;
		this.permissions = options.permissions;
		this.hasUserCommand = options.hasUserCommand;
		this.execute = options.execute;
	}
}

export interface CommandOptions extends ChatInputApplicationCommandData {
	cooldown?: number;
	channelAllowlist?: Snowflake[];
	channelDenylist?: Snowflake[];
	permissions?: ApplicationCommandPermissionData[];
	hasUserCommand?: boolean;
	execute(
		interaction:
			| CommandInteraction
			| ContextMenuInteraction
			| AutocompleteInteraction
	): Awaitable<void>;
}
