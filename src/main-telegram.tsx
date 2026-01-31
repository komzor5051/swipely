/**
 * Entry point for Telegram Mini App
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import AppTelegram from './AppTelegram';
import { TelegramProvider } from './contexts/TelegramContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TelegramProvider>
      <AppTelegram />
    </TelegramProvider>
  </React.StrictMode>
);
