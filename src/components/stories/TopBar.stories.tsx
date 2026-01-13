import { Meta, StoryObj } from '@storybook/react';
import TopBar from '../TopBar';

const meta: Meta<typeof TopBar> = {
  title: 'Components/TopBar',
  component: TopBar,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    username: 'JohnDoe',
    onOpenPage: () => {},
    onTriggerLogin: () => {},
    onLogout: () => {},
  },
  argTypes: {
    onOpenPage: { action: 'onOpenPage' },
    onTriggerLogin: { action: 'onTriggerLogin' },
    onLogout: { action: 'onLogout' },
  },
};

export default meta;

type Story = StoryObj<typeof TopBar>;

export const Default: Story = {};

export const LightMode: Story = {
  args: {
    username: 'JaneDoe',
  },
};
