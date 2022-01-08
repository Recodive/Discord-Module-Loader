"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const discord_js_1 = require("discord.js");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const DiscordCommand_1 = __importDefault(require("./DiscordCommand"));
const DiscordEvent_1 = __importDefault(require("./DiscordEvent"));
const DiscordModule_1 = __importDefault(require("./DiscordModule"));
class DiscordModuleLoader {
    constructor(client, options) {
        this.client = client;
        this.disallowedChannelMessage = "You're not allowed to execute this command in this channel!";
        this.commandCooldownMessage = "Please wait % seconds before using this command again.";
        this.commands = new discord_js_1.Collection();
        this.modules = new discord_js_1.Collection();
        this.cooldowns = new discord_js_1.Collection();
        this.log = (0, debug_1.default)("Discord-Module-Loader");
        if (options === null || options === void 0 ? void 0 : options.disallowedChannelMessage)
            this.disallowedChannelMessage = options.disallowedChannelMessage;
        if (options === null || options === void 0 ? void 0 : options.commandCooldownMessage)
            this.commandCooldownMessage = options.commandCooldownMessage;
        client.setMaxListeners(Infinity);
        client.on("interactionCreate", this.handleInteraction);
    }
    loadGuilds(dir = "guilds") {
        return __awaiter(this, void 0, void 0, function* () {
            dir = (0, node_path_1.resolve)(dir);
            if (!(0, node_fs_1.existsSync)(dir))
                return;
        });
    }
    loadModules(dir = "modules") {
        return __awaiter(this, void 0, void 0, function* () {
            dir = (0, node_path_1.resolve)(dir);
            if (!(0, node_fs_1.existsSync)(dir))
                return [];
            const modules = (yield (0, promises_1.readdir)(dir)).filter(file => file.endsWith(".js")), log = this.log.extend((0, node_path_1.basename)((0, node_path_1.dirname)(dir)));
            log("Loading %d modules", modules.length);
            const returnModules = [];
            for (const folder of modules) {
                if (!(0, node_fs_1.existsSync)((0, node_path_1.resolve)(dir, folder, "index.js")))
                    throw new Error(`Couldn't find index.js in ${dir}`);
                const module = (yield Promise.resolve().then(() => __importStar(require((0, node_path_1.resolve)(dir, folder, "index.js"))))).default;
                if (!(module instanceof DiscordModule_1.default))
                    throw new Error(`Module ${folder} is not an Module`);
                if (this.modules.has(module.name))
                    throw new Error(`Cannot add ${module.name} more than once.`);
                if ((0, node_fs_1.existsSync)((0, node_path_1.resolve)(dir, folder, "events")))
                    module.addEvents(yield this.loadEvents((0, node_path_1.resolve)(dir, folder, "events")));
                if ((0, node_fs_1.existsSync)((0, node_path_1.resolve)(dir, folder, "commands")))
                    module.addCommands(yield this.loadCommands((0, node_path_1.resolve)(dir, folder, "commands")));
                if ((0, node_fs_1.existsSync)((0, node_path_1.resolve)(dir, folder, "modules")))
                    module.addModules(yield this.loadModules((0, node_path_1.resolve)(dir, folder, "modules")));
                this.modules.set(module.name, module);
                returnModules.push([module.name, module]);
                log("Loaded module %s", module.name);
            }
            return returnModules;
        });
    }
    loadEvents(dir = "events") {
        return __awaiter(this, void 0, void 0, function* () {
            dir = (0, node_path_1.resolve)(dir);
            if (!(0, node_fs_1.existsSync)(dir))
                return [];
            const events = (yield (0, promises_1.readdir)(dir)).filter(file => file.endsWith(".js")), log = this.log.extend((0, node_path_1.basename)((0, node_path_1.dirname)(dir)));
            log("Loading %d events", events.length);
            const returnEvents = [];
            for (const file of events) {
                const event = (yield Promise.resolve().then(() => __importStar(require((0, node_path_1.resolve)(dir, file))))).default;
                if (!(event instanceof DiscordEvent_1.default))
                    throw new Error(`Event ${file} is not an Event`);
                this.client.on(event.event, event.listener);
                returnEvents.push([event.event, event]);
                log("Loaded event %s", event.event);
            }
            return returnEvents;
        });
    }
    loadCommands(dir = "commands", globalCommands = true) {
        return __awaiter(this, void 0, void 0, function* () {
            dir = (0, node_path_1.resolve)(dir);
            if (!(0, node_fs_1.existsSync)(dir))
                return [];
            const commands = (yield (0, promises_1.readdir)(dir)).filter(file => file.endsWith(".js")), log = this.log.extend((0, node_path_1.basename)((0, node_path_1.dirname)(dir)));
            log("Loading %d commands", commands.length);
            const returnCommands = [];
            for (const file of commands) {
                const command = (yield Promise.resolve().then(() => __importStar(require((0, node_path_1.resolve)(dir, file))))).default;
                if (!(command instanceof DiscordCommand_1.default))
                    throw new Error(`Command ${file} is not a Command`);
                if (globalCommands)
                    command.global = true;
                if (this.commands.has(command.name.toLowerCase()))
                    throw new Error(`Cannot add ${command.name} more than once.`);
                this.commands.set(command.name.toLowerCase(), command);
                returnCommands.push([command.name.toLowerCase(), command]);
                log("Loaded command %s", command.name);
            }
            return returnCommands;
        });
    }
    updateSlashCommands() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady())
                throw new Error("Client is not ready.");
            const localGlobalCommands = this.commands.filter(c => c.global), log = this.log.extend("SlashCommands");
            //TODO add guild commands and permissions
            yield this.client.application.commands.set(localGlobalCommands
                .map(c => {
                if (c.hasUserCommand)
                    return [
                        this.convertToGlobalCommand(c),
                        this.convertToUserCommand(c)
                    ];
                return [this.convertToGlobalCommand(c)];
            })
                .flat());
        });
    }
    convertToUserCommand(command) {
        return {
            name: `${command.name.charAt(0).toUpperCase()}${command.name.slice(1)}`,
            defaultPermission: command.defaultPermission,
            type: "USER"
        };
    }
    convertToGlobalCommand(command) {
        return {
            name: command.name,
            options: command.options,
            description: command.description,
            defaultPermission: command.defaultPermission,
            type: "CHAT_INPUT"
        };
    }
    handleInteraction(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (interaction.isCommand() || interaction.isContextMenu()) {
                const command = this.commands.get(interaction.commandName.toLowerCase());
                if (!command)
                    return;
                let allowed = true;
                if (command.channelDenylist &&
                    command.channelDenylist.includes(interaction.channelId))
                    allowed = false;
                else if (command.channelAllowlist &&
                    !command.channelAllowlist.includes(interaction.channelId))
                    allowed = false;
                if (!allowed) {
                    if (!this.disallowedChannelMessage.length)
                        return;
                    return yield interaction.reply({
                        content: this.disallowedChannelMessage,
                        ephemeral: true
                    });
                }
                if (command.cooldown) {
                    if (!this.cooldowns.has(command.name))
                        this.cooldowns.set(command.name, new discord_js_1.Collection());
                    const timestamps = this.cooldowns.get(command.name);
                    if (timestamps.has(interaction.user.id)) {
                        const expirationTime = timestamps.get(interaction.user.id) + command.cooldown * 1000;
                        if (Date.now() < expirationTime) {
                            return yield interaction.reply({
                                content: this.commandCooldownMessage.replace("%", Math.ceil((expirationTime - Date.now()) / 1000).toString()),
                                ephemeral: true
                            });
                        }
                    }
                    timestamps.set(interaction.user.id, Date.now());
                    setTimeout(() => timestamps.delete(interaction.user.id), command.cooldown * 1000);
                }
                try {
                    yield command.execute(interaction);
                }
                catch (err) {
                    console.error(err);
                }
            }
        });
    }
}
exports.default = DiscordModuleLoader;
//# sourceMappingURL=ModuleLoader.js.map