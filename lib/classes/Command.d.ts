import BaseClass from "./BaseClass";
import type { ApplicationCommandOptionData, ApplicationCommandPermissionData, Awaitable, ChatInputApplicationCommandData, CommandInteraction, Snowflake, ContextMenuInteraction } from "discord.js";
import type { ApplicationCommandTypes } from "discord.js/typings/enums";
export default class Command extends BaseClass {
    global: boolean;
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
    execute: (interaction: CommandInteraction | ContextMenuInteraction) => Awaitable<void>;
    constructor(options: CommandOptions);
}
export interface CommandOptions extends ChatInputApplicationCommandData {
    cooldown?: number;
    channelAllowlist?: Snowflake[];
    channelDenylist?: Snowflake[];
    permissions?: ApplicationCommandPermissionData[];
    hasUserCommand?: boolean;
    execute(interaction: CommandInteraction | ContextMenuInteraction): Awaitable<void>;
}
