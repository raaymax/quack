const db = require('../../infra/database');

module.exports = {
  name: 'me',
  description: 'info about current user',
  args: [],
  handler: async (req, res) => {
    const user = await db.user.get({ id: req.userId });

    await res.send({
      type: 'message',
      id: `me:${Math.random().toString(10)}`,
      userId: 'system',
      createdAt: new Date().toISOString(),
      channelId: req.body.context.channelId,
      message: [
        { text: 'ID: ' }, { text: req.userId }, { br: true },
        { text: 'User: ' }, { text: user.name }, { br: true },
        { text: 'Avatar: ' }, { link: { href: user.avatarUrl, children: { text: user.avatarUrl } } }, { br: true },
      ],
    });
    return res.ok();
  },
};