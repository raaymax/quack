import { Agent } from "@planigale/testing";
import { ObjectId } from "mongodb";
import { login, usingChannel } from "../../__tests__/mod.ts";
import { EntityId } from "../../../../../types.ts";
import { createApp } from "../../__tests__/app.ts";

Deno.env.set("ENV_TYPE", "test");
const { app, repo, core } = createApp();

const validId = new ObjectId().toHexString();

const getRandomId = () => new ObjectId().toHexString();

Deno.test("Check all validations for message field", async (t) => {
  const agent = await Agent.from(app);
  const { token, userId } = await login(repo, agent);
  await usingChannel(repo, {
    name: "messages-formating-check",
    users: [EntityId.from(userId)],
  }, async (channelId) => {
    const testPart = async (
      status: number,
      name: string,
      message: Record<string, unknown> | Record<string, unknown>[],
    ) =>
      await t.step(name, async () =>
        await agent.request()
          .post(`/api/channels/${channelId}/messages/`)
          .json({
            clientId: getRandomId(),
            flat: "test",
            message,
          })
          .header("Authorization", `Bearer ${token}`)
          .expect(status)
          .then(async (res) => {
            await res.body?.cancel();
            await repo.message.removeMany({
              channelId: EntityId.from(channelId),
            });
          }, async (err) => {
            console.log("ERRETE", err);
            await repo.message.removeMany({
              channelId: EntityId.from(channelId),
            });
            throw err;
          }));
    await testPart(400, "Should return status 400 for empty", {});
    await testPart(200, "Should return status 200 for empty array", []);
    await testPart(200, "Should return status 200 for array with one element", [
      { text: "Hello" },
    ]);
    await testPart(400, "Should return status 400 if match many parts", {
      text: "Hello",
      emoji: "👋",
    });
    await testPart(
      200,
      "Should return status 200 for array with many elements",
      [{ text: "Hello" }, { emoji: "👋" }],
    );
    await testPart(200, "Should return status 200 for bullet", {
      bullet: { text: "Hello" },
    });
    await testPart(200, "Should return status 200 for ordered", {
      ordered: { text: "Hello" },
    });
    await testPart(200, "Should return status 200 for item", {
      item: { text: "Hello" },
    });
    await testPart(200, "Should return status 200 for codeblock", {
      codeblock: "Hello",
    });
    await testPart(200, "Should return status 200 for blockquote", {
      blockquote: { text: "Hello" },
    });
    await testPart(200, "Should return status 200 for code", { code: "Hello" });
    await testPart(200, "Should return status 200 for line", {
      line: { text: "Hello" },
    });
    await testPart(200, "Should return status 200 for br", { br: true });
    await testPart(200, "Should return status 200 for text", { text: "Hello" });
    await testPart(200, "Should return status 200 for bold", {
      bold: { text: "Hello" },
    });
    await testPart(200, "Should return status 200 for italic", {
      italic: { text: "Hello" },
    });
    await testPart(200, "Should return status 200 for underline", {
      underline: { text: "Hello" },
    });
    await testPart(200, "Should return status 200 for strike", {
      strike: { text: "Hello" },
    });
    await testPart(400, "Should return status 400 for old img format", {
      img: { src: "Hello", alt: "World" },
    });
    await testPart(200, "Should return status 200 for img", {
      img: "Hello",
      _alt: "World",
    });
    await testPart(400, "Should return status 400 for old link format", {
      link: { href: "Hello", children: { text: "World" } },
    });
    await testPart(200, "Should return status 200 for link", {
      link: { text: "World" },
      _href: "Hello",
    });
    await testPart(200, "Should return status 200 for emoji", { emoji: "👋" });
    await testPart(200, "Should return status 200 for channel", {
      channel: validId,
    });
    await testPart(400, "Should return status 400 for invalid channel id", {
      channel: "invalid",
    });
    await testPart(
      400,
      "Should return status 400 for invalid channel id (minLength)",
      { channel: "0000000000000000000000000" },
    );
    await testPart(
      400,
      "Should return status 400 for invalid channel id (maxLength)",
      { channel: "00000000000000000000000" },
    );
    await testPart(200, "Should return status 200 for user", { user: validId });
    await testPart(400, "Should return status 400 for invalid user id", {
      user: "invalid",
    });
    await testPart(400, "Should return status 400 for old thread format", {
      thread: { channelId: validId, parentId: validId, text: "Hello" },
    });
    await testPart(200, "Should return status 200 for thread", {
      thread: "Hello",
      _channelId: validId,
      _parentId: validId,
    });
    await testPart(400, "Should return status 400 for invalid thread text", {
      thread: undefined,
      _channelId: validId,
      _parentId: validId,
    });
    await testPart(
      400,
      "Should return status 400 for invalid thread parentId",
      { thread: "Hello", _channelId: validId, _parentId: "invalid" },
    );
    await testPart(
      400,
      "Should return status 400 for invalid thread channelId",
      { thread: "Hello", _channelId: "invalid", _parentId: validId },
    );
  });
  await agent.close();
});
