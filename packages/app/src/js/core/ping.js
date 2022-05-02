export const initPing = (client) => {
  setInterval(async () => {
    if (!client.isOpen) return;
    const start = new Date();
    try {
      await client.req({ op: { type: 'ping' } });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      if (window.debug) {
        await client.emit('message', {
          notifType: 'debug', notif: `Ping: ${new Date() - start}ms`, createdAt: new Date(),
        });
      }
    }
  }, 10000);
}