import { makeAutoObservable, flow } from "mobx"
import { User } from "../../types"
import { client } from "../client"
import { UserModel } from "./user";
import type { AppModel } from "./app";

export class UsersModel {
    users: {[id: string]: UserModel};
    root: AppModel;

    constructor(root: AppModel) {
        makeAutoObservable(this, {
          root: false,
        })
        this.root = root;
        this.users = {};

        client.on('user', (user: User) => this.upsert(user));
    }

    async dispose() {
      await Promise.all(Object.values(this.users).map(user => user.dispose()));
      this.users = {};
    }

    upsert(user: User) {
      if(!this.users[user.id]) {
        this.users[user.id] = new UserModel(user, this.root);
      }else{
        this.users[user.id].patch(user);
      }
    }

    load = flow(function*(this: UsersModel) {
      const users = yield client.api.getUsers();
      users.forEach((user: User) => this.upsert(user));
    })

    get(id: string): UserModel | null{
      return this.users[id] ?? null;
    }

    getAll({hidden = false}: {hidden?: boolean} = {}) {
      return Object.values(this.users)
        .filter((user: UserModel) => (
          hidden || !user.hidden
        ));
    }
}
