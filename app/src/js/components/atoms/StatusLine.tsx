import { observer } from "mobx-react-lite";
import { TypingModel } from "../../core/models/typing";
import { InfoModel } from "../../core/models/info";

type StatusLineProps = {
  typing: TypingModel;
  info: InfoModel;
};

export const StatusLine = observer(({ typing, info }: StatusLineProps) => {
  if (info.type !== "none") {
    return <div className="info">{info.getStatusLine()}</div>;
  }

  return <div className="info">{typing.getStatusLine()}</div>;
});
