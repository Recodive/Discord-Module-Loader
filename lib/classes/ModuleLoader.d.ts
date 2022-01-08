import debug from "debug";
import { Collection } from "discord.js";
import DiscordCommand from "./DiscordCommand";
import DiscordEvent from "./DiscordEvent";
import DiscordModule from "./DiscordModule";
import type { Client } from "discord.js";
export interface ModuleLoaderOptions {
    disallowedChannelMessage: string;
    commandCooldownMessage: string;
}
export default class DiscordModuleLoader {
    client: Client;
    disallowedChannelMessage: string;
    commandCooldownMessage: string;
    commands: Collection<string, DiscordCommand>;
    modules: Collection<string, DiscordModule>;
    cooldowns: Collection<string, Collection<string, number>>;
    log: debug.Debugger;
    constructor(client: Client, options?: ModuleLoaderOptions);
    loadGuilds(dir?: string): Promise<void>;
    loadModules(dir?: string): Promise<[string, DiscordModule][]>;
    loadEvents(dir?: string): Promise<[string, DiscordEvent<any>][]>;
    loadCommands(dir?: string, globalCommands?: boolean): Promise<[string, DiscordCommand][]>;
    updateSlashCommands(): Promise<void>;
    private convertToUserCommand;
    private convertToGlobalCommand;
    private handleInteraction;
}
