import { makeAutoObservable } from "mobx";
import type { AppModel } from "./app.ts";

type InfoModelOpts = {
  type?: "error" | "info" | "none";
  msg?: string;
  action?: string;
};

export class InfoModel {
  type: "error" | "info" | "none";
  msg: string;
  action?: string;

  root: AppModel;

  constructor(opts: InfoModelOpts, root: AppModel) {
    makeAutoObservable(this, {
      root: false,
    });

    this.type = opts?.type ?? "none";
    this.msg = opts?.msg ?? "";
    this.action = opts?.action;

    this.root = root;
  }

  async dispose() {
    this.type = "none";
    this.msg = "";
    delete this.action;
  }

  setMessage = (msg: string | null) => {
    if (msg === null) {
      this.type = "none";
      this.msg = "";
      return;
    }

    this.type = "info";
    this.msg = msg;
  };

  getStatusLine = () => {
    if (this.type === "none") return "";
    if (this.type === "error") return "ERROR: " + this.msg;
    return this.msg;
  };
}
