import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/topbar.css';
import './styles/explorer.css';
import './styles/editor.css';
import './styles/output.css';
import './styles/review.css';
import './styles/statusbar.css';
import './styles/modal.css';
import './styles/wizard.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
