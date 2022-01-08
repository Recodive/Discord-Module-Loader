import debug from "debug";
import { Collection } from "discord.js";
import Command from "./Command";
import type { Client } from "discord.js";
export interface ModuleLoaderOptions {
    disallowedChannelMessage: string;
    commandCooldownMessage: string;
}
export default class DiscordModuleLoader {
    client: Client;
    disallowedChannelMessage: string;
    commandCooldownMessage: string;
    commands: Collection<string, Command>;
    cooldowns: Collection<string, Collection<string, number>>;
    log: debug.Debugger;
    constructor(client: Client, options?: ModuleLoaderOptions);
    loadModule(dir?: string): Promise<void>;
    loadEvents(dir?: string): Promise<void>;
    loadCommands(dir?: string, globalCommands?: boolean): Promise<void>;
    updateSlashCommands(): Promise<void>;
    private handleInteraction;
}
