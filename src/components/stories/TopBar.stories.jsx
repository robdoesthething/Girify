import TopBar from '../TopBar';

export default {
  title: 'Components/TopBar',
  component: TopBar,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    score: 1500,
    bestScore: 2400,
    onMenu: () => {},
    theme: 'dark',
  },
  argTypes: {
    theme: {
      control: { type: 'select' },
      options: ['light', 'dark'],
    },
  },
};

export const Default = {};

export const LightMode = {
  args: {
    theme: 'light',
  },
};
