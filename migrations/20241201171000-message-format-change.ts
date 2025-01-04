import { Db } from "mongodb";

const transform = (json: any, prop: string) => {
	return {
		[prop]: update(json[prop])
	};
}
const transformText = (json: any) => {
	return json;
}

const transformImage = (json: any) => {
  if(json._alt) return json;
	return {
		img: json.img.src,
		_alt: json.img.alt
	};
}

const transformLink = (json: any) => {
  if(json._href) return json;
	return {
		link: json.link.children,
		_href: json.link.href,
	};
}

const transformThread = (json: any) => {
  if(json._channel) return json;
	return {
		thread: json.thread.text,
		_channelId: json.thread.channelId,
		_parentId: json.thread.parentId,
	};
}

const transformButton = (json: any) => {
  if(json._action) return json;
	return {
		button: json.button.text,
		_action: json.button.action,
		_style: json.button.style,
		_payload: json.button.payload,
	};
}

export const update = (json: any): any  => {
	if (json['bullet']) return transform(json, 'bullet');
	if (json['ordered']) return transform(json, 'ordered');
	if (json['item']) return transform(json, 'item');
	if (json['codeblock']) return json;
	if (json['blockquote']) return transform(json, 'blockquote');
	if (json['code']) return json;
	if (json['line']) return transform(json, 'line');
	if (json['br']) return json;
	if (json['text']) return transformText(json);
	if (json['bold']) return transform(json, 'bold');
	if (json['italic']) return transform(json, 'italic');
	if (json['underline']) return transform(json, 'underline');
	if (json['strike']) return transform(json, 'strike');
	if (json['img']) return transformImage(json);
	if (json['link']) return transformLink(json);
	if (json['emoji']) return json;
	if (json['channel']) return json;
	if (json['user']) return json;
	if (json['thread']) return transformThread(json);
	if (json['button']) return transformButton(json);
	if (json['wrap']) return transform(json, 'wrap');
	if (json['column']) return transform(json, 'column');
	return json;
}
 
export const up = async (db: Db) => {
	const docs = db.collection('messages').find({});
	for await (const doc of docs) {
    const newMessage = [doc.message].flat().map(m => update(m));
    if (JSON.stringify(doc.message) === JSON.stringify(newMessage)) {
      continue;
    }
    console.log(doc._id);
		await db.collection('messages').updateOne({ _id: doc._id }, { $set: { message: newMessage } });
	}
};

export const down = async () => {
	// empty
}
