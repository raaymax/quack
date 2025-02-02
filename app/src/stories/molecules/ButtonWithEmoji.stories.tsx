import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { ButtonWithEmoji } from '../../js/components/molecules/ButtonWithEmoji';
import { AppModel } from '../../js/core/models/app.ts';
import { AppProvider } from '../../js/components/contexts/appState.tsx';

const app = new AppModel();
app.emojis.upsert({
  empty: false,
  unicode: "😀",
  shortname: ":smile:",
  category: "people",
});

const meta: Meta<typeof ButtonWithEmoji> = {
  component: ButtonWithEmoji,
  decorators: [
    (Story) => (
      <AppProvider value={app}><Story /></AppProvider>
    ),
  ],
};
 
export default meta;
type Story = StoryObj<typeof ButtonWithEmoji>;
 
export const Primary: Story = {
  args: {
    emoji: ":smile:",
    children: "Hello, World!",
  },
};
