import { makeAutoObservable, observable, computed, action, flow } from "mobx"
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
    }

    load = flow(function*(this: UsersModel) {
      const users = yield client.api.getUsers();
      users.forEach((user: User) => {
        if(!this.users[user.id]) {
          this.users[user.id] = new UserModel(user, this.root);
        }else{
          this.users[user.id].patch(user);
        }
      });
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
