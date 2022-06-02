const { genToken, genHash } = require('../tools');
const { sessionRepo, userRepo } = require('../infra/database/db');
const Errors = require('../errors');

module.exports = {
  userLogin,
  sessionRestore,
  sessionDestroy,
  hideSecret,
};

function hideSecret(user) {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };
}

async function userLogin(login, password) {
  const user = await userRepo.get({ login, password: genHash(password) });
  if (!user) return {};
  const session = await createSession(user.id);
  return { session, user: hideSecret(user) };
}

async function sessionRestore({ id = '', secret }) {
  const session = await sessionRepo.get({ id });
  if (session) {
    if (session.token === genHash(secret)) {
      const user = await userRepo.get({ id: session.userId });
      const newSession = await refreshSession(session);
      return { session: newSession, user: hideSecret(user) };
    }
    await sessionRepo.delete({ userId: session.userId });
    throw Errors.SessionTerminated('Hack!?!');
  }
  throw Errors.SessionNotFound();
}

async function sessionDestroy({ id }) {
  const session = await sessionRepo.get({ id });
  if (!session) throw Errors.SessionNotFound();
  await sessionRepo.delete({ id });
}

async function createSession(userId) {
  const secret = genToken();
  const token = genHash(secret);
  const session = await sessionRepo.insert({ token, userId });
  return { id: session.id, secret };
}

async function refreshSession(session) {
  const { id } = session;
  const secret = genToken();
  const token = genHash(secret);
  await sessionRepo.update(id, { token });
  return { id, secret };
}
