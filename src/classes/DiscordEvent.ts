import BaseClass from "./BaseClass";

import type { Awaitable, ClientEvents } from "discord.js";

export default class DiscordEvent<
	K extends keyof ClientEvents
> extends BaseClass {
	guildId?: string;
	constructor(
		public event: K,
		public listener: (...args: ClientEvents[K]) => Awaitable<any>
	) {
		super();
	}
}
