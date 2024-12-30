export * from "./auth.ts";
export * from "./channels.ts";
export * from "./users.ts";
export * from "./app.ts";
export * from "./chat.ts";

/*
import { repo } from "../../../../infra/mod.ts";
import { ChannelType } from "../../../../types.ts";

export const using = async (arr: AsyncGenerator<any>, fn) => {
  const asd = await Promise.all(arr.map(async (value) => value.next()));

  await fn(Object.fromEntries(asd));

  await Promise.all(arr.map(async (value) => value.next()));
}

async function* channel(name: string): AsyncGenerator<any> {
  const channelId = await repo.channel.create({ name, channelType: ChannelType.PUBLIC });
  yield await repo.channel.get({ id: channelId });
  return await repo.channel.remove({ id: channelId });
}

await using([
  user('admin')
  ({user}) => channel('general'),
  message()
], async ({admin, general}) => {
  console.log(admin, general);
});

*/
