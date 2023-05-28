const Joi = require('joi');
const repo = require('../../infra/repositories');
const services = require('../services');

module.exports = {
  type: 'channel:create',
  schema: {
    body: Joi.object({
      name: Joi.string().required(),
      private: Joi.boolean().optional().default(false),
    }),
  },
  handler: async (req, res) => {
    const msg = req.body;

    const channelId = await services.channel.create({
      name: msg.name,
      userId: req.userId,
      private: msg.private,
      users: [req.userId],
    });

    await repo.channel.update({ id: channelId }, { private: msg.private });
    const ret = await repo.channel.get({ id: channelId });

    res.broadcast({ type: 'channel', ...ret });
    res.ok({});
  },
};
