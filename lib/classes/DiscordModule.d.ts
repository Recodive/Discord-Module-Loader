import { Collection } from "discord.js";
import BaseClass from "./BaseClass";
import DiscordCommand from "./DiscordCommand";
import DiscordEvent from "./DiscordEvent";
export default class DiscordModule extends BaseClass {
    name: string;
    events: Collection<string, DiscordEvent<any>>;
    commands: Collection<string, DiscordCommand>;
    modules: Collection<string, DiscordModule>;
    constructor(name: string);
    addEvents(events: [string, DiscordEvent<any>][]): void;
    addCommands(commands: [string, DiscordCommand][]): void;
    addModules(modules: [string, DiscordModule][]): void;
}
