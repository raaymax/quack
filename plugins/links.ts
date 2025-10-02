import { getLinkPreview } from 'link-preview-js';

interface Link {
  images?: string[];
  description?: string;
}

interface Message {
  id: string;
  linkPreviews: Link[];
}

async function processLinks(links, messageId, core) {
  const { repo, bus } = core;
  try {
    // Fetch link previews for all links
    const data = await Promise.all(links.map((link) => getLinkPreview(link)));

    // Filter previews that have images or descriptions
    const previews = data.filter((link: Link) => 
      (link.images && link.images.length > 0) || (link.description && link.description.length > 0)
    );

    // Update the message with link previews
    await repo.message.update({ id: messageId }, { linkPreviews: previews });

    // Get the updated message
    const updated = await repo.message.get({ id: messageId }) as Message;

    // Broadcast the updated message
    await bus.broadcast({ type: 'message', ...updated });
  } catch (err) {
    console.error('Error adding link preview:', err);
  }
}

export default (config) => async (app, core) => {
  core.events.on(async (event) => {
    if (event.type === 'message:created' || event.type === 'message:updated') {
      console.log(event);
    }

  })
};


// preview
/*

preview = [
  {columns: [
    {column: [
      {line: {image: {url: 'imageUrl', alt: 'title'}}},
      {line: {bold: 'title'}},
      {line: {text: 'description'}}
    ]}
    {column: [
      {line: {image: {url: 'imageUrl', alt: 'title'}}},
      {line: {bold: 'title'}},
      {line: {text: 'description'}}
    ]}
  ]}
]

*/
