import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.css';
import './styles/base.scss';
import './styles/app.scss';
import './styles/dragDrop.scss';
import './styles/changePassword.scss';
import './styles/todoList.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { apiSlice } from './components/todoList/services/apiSlice';
import {store} from './store';
import { ApiProvider } from '@reduxjs/toolkit/query/react';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <ApiProvider api={apiSlice}>
      <Provider store={store}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App/>
        </BrowserRouter>
      </Provider>
    </ApiProvider>
  </React.StrictMode>
);

// Register service worker for offline support
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('✅ App is ready for offline use');
  },
  onUpdate: () => {
    console.log('🔄 New version available. Please refresh.');
  },
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
