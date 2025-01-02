import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { Message } from '../../js/components/organisms/Message';
import { HoverProvider } from '../../js/components/contexts/hover.tsx';
import { store, actions } from '../../js/store';

const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sollicitudin scelerisque nisl quis condimentum. Aliquam eget lacus eros. Vestibulum ac posuere massa, eget euismod enim. Nulla interdum magna tortor. Vestibulum sagittis, ex in maximus maximus, neque purus tempor magna, sit amet molestie sapien est id augue. Nulla imperdiet leo nec nisl commodo, nec fringilla leo vehicula. Suspendisse nibh orci, convallis at dictum ut, volutpat non orci. Nulla scelerisque sapien eget purus ullamcorper, eu pellentesque odio tincidunt. Vivamus quis maximus sapien, vitae placerat urna. Vestibulum finibus facilisis aliquam. Aliquam iaculis augue vel metus varius cursus.";
 
const meta: Meta<typeof Message> = {
  component: Message,
  parameters: {
  },
  decorators: [
    (Story) => (
      <HoverProvider><Story /></HoverProvider>
    ),
  ],
  loaders: [async () => {
    store.dispatch(actions.users.add({
      id: '123',
      name: 'User',
    }));
    store.dispatch(actions.users.add({
      id: '321',
      name: 'User2',
    }));
    store.dispatch(actions.emojis.add({
      shortname: ':thumbsup:',
      unicode: '1f44d',
    }));
    store.dispatch(actions.emojis.add({
      shortname: ':thumbsdown:',
      unicode: '1f44e',
    }));
  }],
};
 
export default meta;
type Story = StoryObj<typeof Message>;
 
const BaseMessage = {
  id: '321',
  secured: false as const,
  channelId: 'main',
  userId: '123',
  createdAt: '2021-01-01T00:00:00Z',
  clientId: '123',
  flat: 'Hello, world!',
  links: [],
  emojiOnly: false,
  reactions: [],
  mentions: [],
  thread: [],
  parsingErrors: [],
  attachments: [],
  linkPreviews: [],
  parentId: '',
  appId: '123',
  pinned: false,
  editing: false,
  updatedAt: '2021-01-01T00:00:00Z',
  message: {
    line: { text: 'Hello, world!' },
  },
}

const LongTextMessage = {
  ...BaseMessage,
  flat: LOREM,
  message: {
    line: { text: LOREM },
  }
}

export const Primary: Story = {
  args: {
    mode: 'default',
    channelId: '123',
    data: {
      ...BaseMessage,
    },
  },
};

export const ReadReceipts: Story = {
  args: {
    mode: 'default',
    channelId: '123',
    data: {
      ...BaseMessage,
      progress: [
        {userId: '123', user: {avatarUrl: '', name: 'User'}},
        {userId: '123', user: {avatarUrl: '', name: 'User'}}
      ],
    },
  },
};
export const LongText: Story = {
  args: {
    mode: 'default',
    channelId: '123',
    data: {
      ...LongTextMessage,
    }
  },
};

export const WithThread: Story = {
  args: {
    mode: 'default',
    channelId: '123',
    data: {
      ...LongTextMessage,
      thread: [
        {
        childId: '123',
        userId: '123',
        },
        {
        childId: '321',
        userId: '321',
        }
      ],
    }
  },
};
export const WithReaction: Story = {
  args: {
    mode: 'default',
    channelId: '123',
    data: {
      ...BaseMessage,
      reactions: [
        {
          userId: '123',
          reaction: ':thumbsup:',
        },
        {
          userId: '321',
          reaction: ':thumbsup:',
        },
        {
          userId: '321',
          reaction: ':thumbsdown:',
        }

      ]
    }
  },
};

export const Ephemeral: Story = {
  args: {
    mode: 'default',
    data: {
      ...BaseMessage,
      ephemeral: true,
    }
  },
};

export const Continuation: Story = {
  args: {
    mode: 'default',
    sameUser: true,
    data: {
      ...BaseMessage,
    }
  },
};

export const EmojiOnly: Story = {
  args: {
    mode: 'default',
    data: {
      ...BaseMessage,
      flat: ':thumbsup:',
      message: {
        emoji: ":thumbsup:",
      },
      emojiOnly: true,
    }
  },
};


export const WithImages: Story = {
  args: {
    mode: 'default',
    data: {
      ...BaseMessage,
      attachments: [
        {
          id: '123',
          fileName: 'image.jpg',
          contentType: 'image/jpeg',
          url: 'https://picsum.photos/200',
        },
        {
          id: '321',
          fileName: 'image2.jpg',
          contentType: 'image/jpeg',
          url: 'https://picsum.photos/200',
        }
      ]
    }
  },
};

export const WithError: Story = {
  args: {
    mode: 'default',
    data: {
      ...BaseMessage,
      info: {
        type: 'error',
        msg: 'Sending message failed',
        action: 'retry',
      }
    }
  },
};
export const WithLinkPreview: Story = {
  args: {
    mode: 'default',
    data: {
      ...BaseMessage,
      flat: 'http://example.com',
      message: {link: {text: 'http://example.com'}, _href: 'http://example.com'},
      links: ['http://example.com'],
      linkPreviews: [
        {
          url: 'http://example.com',
          title: 'Example',
          description: LOREM,
          images: ['https://picsum.photos/200'],
          videos: [],
          mediaType: 'website',
          favicons: [],
          charset: 'utf-8',
          siteName: 'Example',
          contentType: 'text/html',
        },{
          url: 'http://example.com',
          title: 'Example',
          description: LOREM,
          images: ['https://picsum.photos/200'],
          videos: [],
          mediaType: 'website',
          favicons: [],
          charset: 'utf-8',
          siteName: 'Example',
          contentType: 'text/html',
        }

      ]
    }
  },
};

export const WithLinkAnnotations: Story = {
  args: {
    mode: 'default',
    data: {
      ...BaseMessage,
      flat: 'http://example.com',
      message: {link: {text: 'http://example.com'}, _href: 'http://example.com'},
      links: ['http://example.com'],
      annotations: [
        {wrap: [
          {
            column: [
              {line: {img: 'https://picsum.photos/200', _alt: 'title'}},
              {line: {bold: {text: 'title'}}},
              {line: {italic: {text: LOREM}}}
            ], 
            _width: 200

          },
          {column: [
            {line: {img: 'https://picsum.photos/200', _alt: 'title'}},
            {line: {bold: {text: 'title'}}},
            {line: {text: LOREM}}
          ], 
          _width: 200}
        ]}
      ],
    }
  },
};
