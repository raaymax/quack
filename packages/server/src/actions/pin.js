const Joi = require('joi');
const { messageRepo } = require('../infra/database');
// const service = require('../message/messageService');
// const Errors = require('../errors');
const { MissingId, MessageNotExist, MissingChannel } = require('../common/errors');

module.exports = {
  type: 'pin',
  schema: {
    body: Joi.object({
      channel: Joi.string().required(),
      id: Joi.string().required(),
      pinned: Joi.boolean().required(),
    }),
  },
  handler: async (req, res) => {
    const { id, channel, pinned } = req.body;
    if (!id) throw MissingId();
    if (!channel) throw MissingChannel();

    const message = await messageRepo.get({ id });
    if (!message) throw MessageNotExist();

    await messageRepo.update({ id }, { pinned });
    await res.broadcast({
      id,
      type: 'message',
      ...message,
      pinned,
    });
    return res.ok();
  },
};