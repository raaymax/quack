const APP_ID = 'giphy';

export default (config) => async (app, core) => {

  //const app = core.registerApp('giphy')

  class GiphyCommand {
      static commandName = 'giphy';
      static description = 'Search for a gif on Giphy';
      static prompt = 'search term';

      static async execute(data: any, core: any) {
        const ret = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${config.giphyApiKey}&q=${data.text}&limit=25&offset=0&rating=g&lang=en&bundle=messaging_non_clips`)
        const results = await ret.json();

        const text = data.text;
        const count = results.pagination.count;
        const idx = 0;
        const images = results.data.map((result: any) => ({
          imageUrl: result.images.fixed_height.url,
          title: result.title,
        }));
        const payload = {
          ...images[idx],
          text,
          idx,
          count,
          images,
        };

        const clientId = `${APP_ID}:${Math.random().toString(10)}`;

        GiphyCommand.showPreview({
          userId: data.userId,
          clientId,
          channelId: data.context.channelId
        }, payload, core);
      }

      static async next(interaction: any, core: any) {
        const idx = (interaction.payload.idx + 1) % interaction.payload.count;
        let payload = interaction.payload;
        GiphyCommand.showPreview({
          userId: interaction.userId,
          clientId: interaction.clientId,
          channelId: interaction.channelId
        }, {
          ...payload,
          ...payload.images[idx],
          idx
        }, core);
      }

      static async prev(interaction: any, core: any) {
        let idx = interaction.payload.idx - 1;
        if (idx < 0) idx = interaction.payload.count + idx;
        let payload = interaction.payload;
        GiphyCommand.showPreview({
          userId: interaction.userId,
          clientId: interaction.clientId,
          channelId: interaction.channelId
        }, {
          ...payload,
          ...payload.images[idx],
          idx
        }, core);
      }

      static showPreview(loc, payload, core) {
        core.bus.direct(loc.userId, {
          type: "message",
          appId: APP_ID,
          clientId: loc.clientId,
          ephemeral: true,
          channelId: loc.channelId,
          flat: 'Giphy search results',
          message: [
            { line: [{ text: `Giphy search results: ${(payload.idx+1)} / ${payload.count}`}] },
            { line: { img: payload.imageUrl, _alt: payload.title } },
            { line: [
              { button: "Send", _action: 'giphy:send', _payload: payload },
              { button: "Next", _action: 'giphy:next', _payload: payload },
              { button: "Previous", _action: 'giphy:prev', _payload: payload },
              { button: "Cancel", _action: 'giphy:close' },
            ]},
          ],
          createdAt: new Date().toISOString(),
        });
      }

      static async send(interaction: any, core: any) {
        core.bus.direct(interaction.userId, {
          type: "message:remove",
          clientId: interaction.clientId,
          appId: APP_ID,
          channelId: interaction.channelId,
        });
        await core.dispatch({
          type: "message:create",
          body: {
            channelId: interaction.channelId,
            parentId: interaction.parentId,
            userId: interaction.userId,
            flat: interaction.text,
            message: [
              { line: [ {text: "/giphy "}, {text: interaction.payload.text}]},
              { line: { img: interaction.payload.imageUrl, _alt: interaction.text } },
            ],
          },
        });
      }
      static async close(interaction: any, core: any) {
        core.bus.direct(interaction.userId, {
          type: "message:remove",
          clientId: interaction.clientId,
          appId: APP_ID,
          channelId: interaction.channelId,
        });
      }
  }

  core.events.on(async (event: any) => {
    if(event.type === 'message:interaction') {
      if(event.payload.action === 'giphy:send') {
        await GiphyCommand.send(event.payload, core);
      }
      if(event.payload.action === 'giphy:next') {
        await GiphyCommand.next(event.payload, core);
      }
      if(event.payload.action === 'giphy:prev') {
        await GiphyCommand.prev(event.payload, core);
      }
      if(event.payload.action === 'giphy:close') {
        await GiphyCommand.close(event.payload, core);
      }
    }
  })
  core.registerUserCommand(GiphyCommand);
}
