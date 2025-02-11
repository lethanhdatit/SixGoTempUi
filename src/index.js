import React from 'react';
import ReactDOM from 'react-dom/client';
import './output.css';
import ChatHistory from './pages/ChatHistory';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChatHistory />
  </React.StrictMode>
);