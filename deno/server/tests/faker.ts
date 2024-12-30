import { faker } from "@faker-js/faker";
import config from "@quack/config";
import { Repository } from "../infra/repo/mod.ts";

const repo = new Repository(config);
const user = await repo.user.get({ email: "admin" });
if (!user) {
  throw new Error("User not found");
}
const user2 = await repo.user.get({ email: "member" });
if (!user2) {
  throw new Error("User not found");
}
const channel = await repo.channel.get({ name: "main" });
if (!channel) {
  throw new Error("Channel not found");
}

// await repo.message.removeMany({channelId: channel.id});
for (let i = 0; i < 1000; i++) {
  const text = faker.lorem.sentence();
  console.log(`Creating message: ${text}`);
  await repo.message.create({
    userId: Math.random() > 0.5 ? user.id : user2.id,
    channelId: channel.id,
    clientId: faker.string.uuid(),
    flat: text,
    message: {
      text,
    },
    createdAt: randomDate(new Date(new Date().getFullYear()-2, 0, 1), new Date()),
  });
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}


await repo.close();
