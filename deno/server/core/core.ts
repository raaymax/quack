import { Config } from "@quack/config";
import RemoveSession from "./session/remove.ts";
import CreateSession from "./session/create.ts";
import CreateChannel from "./channel/create.ts";
import RemoveChannel from "./channel/remove.ts";
import GetSession from "./session/get.ts";
import GetUser from "./user/get.ts";
import GetChannel from "./channel/get.ts";
import GetAllChannels from "./channel/getAll.ts";
import CreateMessage from "./message/create.ts";
import GetUserConfig from "./user/getConfig.ts";
import GetAllUsers from "./user/getAll.ts";
import GetAllMessages from "./message/getAll.ts";
import GetMessage from "./message/get.ts";
import RemoveMessage from "./message/remove.ts";
import UpdateMessage from "./message/update.ts";
import PinMessage from "./message/pin.ts";
import GetAllEmojis from "./emoji/getAll.ts";
import CreateEmoji from "./emoji/create.ts";
import ReplaceEmoji from "./emoji/replace.ts";
import CommandExecute from "./command/execute.ts";
import GetAllReadReceipts from "./readReceipt/getAll.ts";
import GetChannelReadReceipts from "./readReceipt/getChannel.ts";
import UpdateReadReceipt from "./readReceipt/update.ts";
import UpdateMessageReadReceipt from "./readReceipt/updateMessage.ts";
import ReactToMessage from "./message/react.ts";
import CreateUser from "./user/create.ts";
import CheckToken from "./user/checkToken.ts";
import UserResetVerify from "./user/resetVerify.ts";
import PutDirectChannel from "./channel/putDirect.ts";
import JoinChannel from "./channel/join.ts";
import GetDirectChannel from "./channel/getDirect.ts";
import CheckChannelAccess from "./channel/checkAccess.ts";
import InteractionWithMessage from "./message/interaction.ts";
import ChannelUserTyping from "./channel/userTyping.ts";
import UserReset from "./user/reset.ts";
import RegisterFile from "./file/register.ts";
import AttachFiles from "./file/attach.ts";
import RemoveFile from "./file/remove.ts";
import GetChannelFiles from "./file/getChannel.ts";
import { registerCommand } from "./command/repository.ts";

import { Repository, storage } from "../infra/mod.ts";
import { buildCommandCollection, EventFrom } from "./command.ts";
import { Bus } from "./bus.ts";
import { Webhooks } from "./webhooks.ts";
import Events from "./events.ts";

const commands = buildCommandCollection([
  CreateMessage,
  RemoveSession,
  CreateSession,
  CreateChannel,
  RemoveChannel,
  UpdateMessage,
  CommandExecute,
  UpdateReadReceipt,
  UpdateMessageReadReceipt,
  PinMessage,
  RemoveMessage,
  CreateUser,
  ReactToMessage,
  PutDirectChannel,
  JoinChannel,
  InteractionWithMessage,
  ChannelUserTyping,
  UserReset,
  RegisterFile,
  AttachFiles,
  RemoveFile,
  CreateEmoji,
  ReplaceEmoji,
]);

export class Core {
  bus: Bus;

  storage: storage.Storage;

  repo: Repository;

  config: Config;

  webhooks?: Webhooks;

  events: Events;

  registerUserCommand = registerCommand;

  channel = {
    access: CheckChannelAccess(this),
    get: GetChannel(this),
    getDirect: GetDirectChannel(this),
    getAll: GetAllChannels(this),
  };

  session = {
    get: GetSession(this),
  };

  user = {
    get: GetUser(this),
    getAll: GetAllUsers(this),
    getConfig: GetUserConfig(this),
    checkToken: CheckToken(this),
    verifyUserReset: UserResetVerify(this),
  };

  message = {
    getAll: GetAllMessages(this),
    get: GetMessage(this),
  };

  emoji = {
    getAll: GetAllEmojis(this),
  };

  readReceipt = {
    getAll: GetAllReadReceipts(this),
    getChannel: GetChannelReadReceipts(this),
  };

  file = {
    getChannel: GetChannelFiles(this),
  };

  constructor(arg: {
    config: Config;
    repo?: Repository;
    fileStorage?: storage.Storage;
  }) {
    this.config = arg.config;
    this.bus = new Bus();
    this.events = new Events();
    this.repo = arg.repo ?? new Repository(arg.config);
    this.storage = arg.fileStorage ?? storage.initStorage(arg.config);

    if (arg.config.webhooks) {
      this.webhooks = new Webhooks(this, arg.config);
    }
  }

  dispatch = (evt: EventFrom<typeof commands[keyof typeof commands]>) => {
    // Type assertion needed: evt.type and evt.body are correlated through
    // the discriminated union, but TypeScript can't prove it for indexed access
    type AnyCommand = typeof commands[keyof typeof commands];
    const cmd = commands[evt.type] as AnyCommand;
    // deno-lint-ignore no-explicit-any
    return (cmd.handler as (
      body: any,
      core: Core,
    ) => ReturnType<AnyCommand["handler"]>)(
      evt.body,
      this,
    );
  };

  close = async () => {
    this.events.dispatch({
      type: "system:close",
      payload: null,
    });

    await this.repo.close();
  };
}
