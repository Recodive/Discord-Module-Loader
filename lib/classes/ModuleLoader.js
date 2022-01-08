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
const Command_1 = __importDefault(require("./Command"));
const Event_1 = __importDefault(require("./Event"));
class DiscordModuleLoader {
    constructor(client, options) {
        this.client = client;
        this.disallowedChannelMessage = "You're not allowed to execute this command in this channel!";
        this.commandCooldownMessage = "Please wait % seconds before using this command again.";
        this.commands = new discord_js_1.Collection();
        this.cooldowns = new discord_js_1.Collection();
        this.log = (0, debug_1.default)("Discord-Module-Loader");
        if (options === null || options === void 0 ? void 0 : options.disallowedChannelMessage)
            this.disallowedChannelMessage = options.disallowedChannelMessage;
        if (options === null || options === void 0 ? void 0 : options.commandCooldownMessage)
            this.commandCooldownMessage = options.commandCooldownMessage;
        client.on("interactionCreate", this.handleInteraction);
    }
    loadModule(dir = "modules") {
        return __awaiter(this, void 0, void 0, function* () {
            dir = (0, node_path_1.resolve)(dir);
            if (!(0, node_fs_1.existsSync)(dir))
                return;
        });
    }
    loadEvents(dir = "events") {
        return __awaiter(this, void 0, void 0, function* () {
            dir = (0, node_path_1.resolve)(dir);
            if (!(0, node_fs_1.existsSync)(dir))
                return;
            const events = (yield (0, promises_1.readdir)(dir)).filter(file => file.endsWith(".js")), log = this.log.extend((0, node_path_1.basename)((0, node_path_1.dirname)(dir)));
            log("Loading %d events", events.length);
            for (const file of events) {
                const event = (yield Promise.resolve().then(() => __importStar(require((0, node_path_1.resolve)(dir, file))))).default;
                if (!(event instanceof Event_1.default))
                    throw new Error(`Event ${file} is not an Event`);
                this.client.on(event.event, event.listener);
                log("Loaded event %s", event.event);
            }
        });
    }
    loadCommands(dir = "commands", globalCommands = true) {
        return __awaiter(this, void 0, void 0, function* () {
            dir = (0, node_path_1.resolve)(dir);
            if (!(0, node_fs_1.existsSync)(dir))
                return;
            const commands = (yield (0, promises_1.readdir)(dir)).filter(file => file.endsWith(".js")), log = this.log.extend((0, node_path_1.basename)((0, node_path_1.dirname)(dir)));
            log("Loading %d commands", commands.length);
            for (const file of commands) {
                const command = (yield Promise.resolve().then(() => __importStar(require((0, node_path_1.resolve)(dir, file))))).default;
                console.log(command);
                if (!(command instanceof Command_1.default))
                    throw new Error(`Command ${file} is not a Command`);
                if (globalCommands)
                    command.global = true;
                this.commands.set(command.name.toLowerCase(), command);
                log("Loaded command %s", command.name);
            }
        });
    }
    updateSlashCommands() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    handleInteraction(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (interaction.isCommand() || interaction.isContextMenu()) {
                const command = this.commands.get(interaction.commandName.toLowerCase());
                if (!command)
                    return; //TODO debug or throw error
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