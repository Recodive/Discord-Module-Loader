# Discord-Module-Loader [![Version](https://img.shields.io/npm/v/discord-module-loader.svg)](https://www.npmjs.com/package/discord-module-loader)

A package that lets you load events and commands easily and fast.
Automatically update the commands on the Discord API just by running a function!

## Instalation

```bash
# npm
npm install discord-module-loader

# yarn
yarn add discord-module-loader
```

## Usage

### Importing

#### TypeScript

```ts
// Here we're importing the default export "ModuleLoader", which is the main class which will load all modules
// as well as the DiscordEvent class which is used to add event listeners to the main class
import ModuleLoader, { DiscordEvent } from "discord-module-loader";
```

#### JavaScript

```js
// Here we're importing the default export "ModuleLoader", which is the main class which will load all modules
// as well as the DiscordEvent class which is used to add event listeners to the main class
const {
	DiscordEvent,
	default: ModuleLoader
} = require("discord-module-loader");
```

Or, if you only want the main class ModuleLoader

```js
const ModuleLoader = require("discord-module-loader");
```

Or if you only want the event class

```js
const { DiscordEvent } = require("discord-module-loader");
```

### Using our module loader

To use the ModuleLoader, your bot has to use the following file structure:

```
●
├─ commands
├─ events
├─ guilds
├─ modules
╰─ index
```

#### `commands` folder

Inside of the `commands` folder you can put as many command files as you want!
We suggest you put the command name as the file name, but it is not required.
The commands folder also accepts sub-directories, meaning that in the commands folder you could put a folder named anything, and put commands inside of there.
In those files the following must be exported:

```js
import { DiscordCommand } from "discord-module-loader";

export default new DiscordCommand({
	name: "name",
	description: "Example command",
	execute: async int => {
		console.log(int);
	}
});
```

In the `DiscordCommand` class you have to pass an object with the following arguments:

| Argument            | Description                                                                     | Required | Type                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `name`              | Name of the command                                                             | Yes      | `string`                                                                                                                           |
| `description`       | Description of the command                                                      | Yes      | `string`                                                                                                                           |
| `defaultPermission` | Whether the command is enabled by default when the app is added to a guild      | No       | `boolean`                                                                                                                          |
| `options`           | The options of the command                                                      | No       | [`ApplicationCommandOptionData`](https://discord.js.org/#/docs/discord.js/stable/typedef/ApplicationCommandOptionData)`[]`         |
| `cooldown`          | The amount of time in seconds a user has to wait between command executions     | No       | `number`                                                                                                                           |
| `channelAllowlist`  | Array of Discord channel ids where the command is allowed to be executed in     | No       | `string[]`                                                                                                                         |
| `channelDenylist`   | Array of Discord channel ids where the command is not allowed to be executed in | No       | `string[]`                                                                                                                         |
| `permissions`       | Permission data of the command                                                  | No       | [`ApplicationCommandPermissionData`](https://discord.js.org/#/docs/discord.js/stable/typedef/ApplicationCommandPermissionData)`[]` |
| `hasUserCommand`    | Whether the command has a user context menu                                     | No       | `boolean`                                                                                                                          |
| `execute`           | The function which will be run when the command is executed                     | Yes      | `Function (interaction:`[`CommandInteraction`](https://discord.js.org/#/docs/discord.js/stable/class/CommandInteraction)`)`        |

#### `events` folder

Inside of the `events` folder you can put as many event files as you want!
We suggest you put the event name as the file name, but it is not required.
In those files the following must be exported:

```ts
import { DiscordEvent } from "discord-module-loader";

export default new DiscordEvent("messageCreate", message => {
	console.log(message.content);
});
```

`"messageCreate"` can be changed for any event name just like the `message` variable can be changed to the incoming data of the event.

#### `modules` folder

To use the `DiscordModule` class you have to use the following file structure:

```
● (modules folder)
╰─ <module name>
   ├─ commands
   ├─ events
   ├─ modules
   ╰─ index
```

The commands, events, and modules folders are just like their above specified ones.
In the index file the following must be exported:

```ts
import { DiscordModule } from "discord-module-loader";

export default new DiscordModule("<module name>");
```

In the `DiscordModule` class you only have to specify the name you want the module to have.

#### `guilds` folder

To use the `DiscordGuild` class you have to use the following file structure:

```
● (guilds folder)
╰─ <guild name>
   ├─ commands
   ├─ events
   ├─ modules
   ╰─ index
```

The commands, events, and modules folders are just like their above specified ones.
But the index one is of course a lil' different! In the index file the following must be exported:

```ts
import { DiscordGuild } from "discord-module-loader";

export default new DiscordGuild("<guildId>");
```

In the `DiscordGuild` class you only have the specify the guildId wherein the commands, events, and modules should work.

#### `index` file

```js
// Firstly we must create the normal Discord Client from Discord.js
const client = new Client({
	intents: [Intents.Flags.GUILD, Intents.Flags.GUILD_MESSAGES]
});

// Afterwards we can initialize the module loader with the Discord.js Client
// a few options could be appended after the client, more information about the ModuleLoader options can be found further below
const moduleLoader = new ModuleLoader(client);

// Now we can login and load all the modules
// inside of the load functions you can also input a string argument for a different file directory if you didn't follow above mentioned file structure
// you can now also update all slash commands on the Discord API by just running the updateSlashCommands function
client.login(process.env.TOKEN);
client.on("ready", async () => {
	await moduleLoader.loadAll();
	await moduleLoader.updateSlashCommands();
});
```

In the `ModuleLoader` class you can pass an object with the following arguments:
(All arguments are optional)

| Argument                   | Description                                                              | Type     | Default Value                                                                |
| -------------------------- | ------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------- |
| `unknownCommandMessage`    | The message shown when a user executes an unknown command                | `string` | Couldn't find executed command. Please try again later, or report the issue. |
| `disabledCommandMessage`   | The message shown when a user executes a disabled command                | `string` | This command is currently disabled. Please try again later.                  |
| `disallowedChannelMessage` | The message shown when a user executes a command in a disallowed channel | `string` | You're not allowed to execute this command in this channel!                  |
| `commandCooldownMessage`   | The message shown when a user executes a command while on cooldown       | `string` | Please wait % seconds before using this command again.                       |

## Contributing

Due to Discord and Discord.js always updating, it is possible some things might break. If you believe you have found and issue, feel free to [open a pull request](https://github.com/Recodive/Discord-Module-Loader/compare).

## Inspiration

Due to the amount of Discord bots our team makes it was always annoying to copy over our module loader and getting it working for that project, hence why we decided to just make one module loader which we can import into all of our Discord Bot projcets. We hope to keep this module updated and working whenever new features are added to Discord/Discord.js, but we may also add custom things to our likings. This package was created by [Bas950](https://github.com/Bas950) and [Timeraa](https://github.com/Timeraa) and is not officially endorsed by Discord nor affiliated with the company in any way.
