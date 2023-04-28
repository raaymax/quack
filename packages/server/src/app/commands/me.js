const repo = require('../../infra/repositories');

module.exports = {
  name: 'me',
  description: 'info about current user',
  args: [],
  handler: async (req, res) => {
    const user = await repo.user.get({ id: req.userId });

    await res.systemMessage([
      { text: 'ID: ' }, { text: req.userId }, { br: true },
      { text: 'User: ' }, { text: user.name }, { br: true },
      { text: 'Avatar: ' }, { link: { href: user.avatarUrl, children: { text: user.avatarUrl } } }, { br: true },
    ]);
    return res.ok();
  },
};
