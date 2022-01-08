import "source-map-support/register";

import DiscordCommand from "./classes/DiscordCommand";
import DiscordEvent from "./classes/DiscordEvent";
import DiscordGuild from "./classes/DiscordGuild";
import DiscordModule from "./classes/DiscordModule";
import ModuleLoader from "./classes/ModuleLoader";

export default ModuleLoader;
export { DiscordCommand, DiscordEvent, DiscordGuild, DiscordModule };
