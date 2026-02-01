import type { SlideTemplate } from './types';

export const gridMultiTemplate: SlideTemplate = {
  id: 'grid_multi',
  name: 'Grid Multi',
  width: 1080,
  height: 1350,
  backgroundColor: '#FAFAFA',
  backgroundPattern: 'grid',
  elements: [
    // Decorative lines (top-right)
    {
      id: 'deco-lines',
      type: 'decoration',
      x: 880,
      y: 40,
      visible: true,
      zIndex: 1,
      shape: 'lines-group',
      color: '#D4F542',
      rotation: -25,
      lines: [
        { offsetY: 0, opacity: 1 },
        { offsetY: 25, opacity: 1 },
        { offsetY: 50, opacity: 1 },
        { offsetY: 75, opacity: 0.5 },
      ],
    },

    // Avatar
    {
      id: 'avatar',
      type: 'avatar',
      x: 70,
      y: 60,
      visible: true,
      zIndex: 10,
      letter: 'S',
      size: 70,
      gradient: ['#F9A8D4', '#D4F542'],
      borderColor: '#FFFFFF',
      borderWidth: 4,
    },

    // Author name
    {
      id: 'author-name',
      type: 'text',
      x: 156,
      y: 70,
      visible: true,
      zIndex: 10,
      content: 'Swipely',
      fontSize: 22,
      fontWeight: 700,
      color: '#0A0A0A',
    },

    // Author handle
    {
      id: 'author-handle',
      type: 'text',
      x: 156,
      y: 98,
      visible: true,
      zIndex: 10,
      content: '@swipely',
      fontSize: 16,
      fontWeight: 500,
      color: '#888888',
    },

    // Main heading (title placeholder)
    {
      id: 'heading',
      type: 'heading',
      x: 70,
      y: 400,
      visible: true,
      zIndex: 5,
      content: '{{TITLE}}',
      fontSize: 88,
      fontWeight: 800,
      color: '#0A0A0A',
      lineHeight: 1.05,
      maxWidth: 850,
    },

    // Content text
    {
      id: 'content',
      type: 'text',
      x: 70,
      y: 650,
      visible: true,
      zIndex: 5,
      content: '{{CONTENT}}',
      fontSize: 32,
      fontWeight: 500,
      color: '#888888',
      lineHeight: 1.5,
      maxWidth: 700,
    },

    // Footer handle
    {
      id: 'footer-handle',
      type: 'text',
      x: 900,
      y: 1240,
      visible: true,
      zIndex: 10,
      content: '{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}',
      fontSize: 18,
      fontWeight: 600,
      color: '#0A0A0A',
    },

    // Footer CTA
    {
      id: 'footer-cta',
      type: 'text',
      x: 900,
      y: 1270,
      visible: true,
      zIndex: 10,
      content: 'Follow for more',
      fontSize: 14,
      fontWeight: 500,
      color: '#888888',
    },

    // Icon: Arrow
    {
      id: 'icon-arrow',
      type: 'icon',
      x: 920,
      y: 1190,
      visible: true,
      zIndex: 10,
      icon: 'arrow',
      size: 45,
      color: '#0A0A0A',
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
    },

    // Icon: Share
    {
      id: 'icon-share',
      type: 'icon',
      x: 975,
      y: 1190,
      visible: true,
      zIndex: 10,
      icon: 'refresh',
      size: 45,
      color: '#0A0A0A',
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
    },
  ],
};
