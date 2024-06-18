import * as v from 'valibot';
import { createCommand } from "../helpers.ts";
import {repo} from '../../infra/mod.ts';

export default createCommand({
  type: 'session:create',
  body: v.object({
    login: v.string(),
    password: v.string(),
  }),
}, async ({ login, password }) => {
  const user = await repo.user.get({login});
  if(!user) return null;
  if(user.password !== password) return null;

  const sessionId = await repo.session.create({userId: user.id});
  return sessionId;
});
