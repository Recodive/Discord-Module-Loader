import BaseClass from "./BaseClass";
import type { Awaitable, ClientEvents } from "discord.js";
export default class DiscordEvent<K extends keyof ClientEvents> extends BaseClass {
    event: K;
    listener: (...args: ClientEvents[K]) => Awaitable<void>;
    constructor(event: K, listener: (...args: ClientEvents[K]) => Awaitable<void>);
}
