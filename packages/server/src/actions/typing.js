const { MissingChannel } = require('../common/errors');

module.exports = (req, res) => {
  const { channel } = req.body;

  if (!channel) throw MissingChannel();

  res.broadcast({
    type: 'typing',
    userId: req.userId,
    channel,
  }, {
    onlyOthers: true,
  });
  res.ok();
};