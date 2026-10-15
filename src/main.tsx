import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root')!;
const app = <React.StrictMode><App /></React.StrictMode>;
if (root.dataset.page === window.location.pathname && !['/my', '/account', '/auth/desktop'].includes(window.location.pathname)) ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);
