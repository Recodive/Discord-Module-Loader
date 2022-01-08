import BaseClass from "./BaseClass";

import type {
	ApplicationCommandOptionData,
	ApplicationCommandPermissionData,
	Awaitable,
	ChatInputApplicationCommandData,
	CommandInteraction,
	Snowflake,
	ContextMenuInteraction
} from "discord.js";
import type { ApplicationCommandTypes } from "discord.js/typings/enums";
export default class Command extends BaseClass {
	global = false;
	name: string;
	description: string;
	defaultPermission?: boolean;
	type?: "CHAT_INPUT" | ApplicationCommandTypes.CHAT_INPUT;
	options?: ApplicationCommandOptionData[];
	cooldown?: number;
	channelAllowlist?: Snowflake[];
	channelDenylist?: Snowflake[];
	permissions?: ApplicationCommandPermissionData[];
	hasUserCommand?: boolean;
	execute: (
		interaction: CommandInteraction | ContextMenuInteraction
	) => Awaitable<void>;

	constructor(options: CommandOptions) {
		super();
		this.name = options.name;
		this.description = options.description;
		this.defaultPermission = options.defaultPermission;
		this.type = options.type;
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
		interaction: CommandInteraction | ContextMenuInteraction
	): Awaitable<void>;
}
