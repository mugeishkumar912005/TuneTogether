import React from 'react';
import { RouterProvider, createBrowserRouter, Routes, Route } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import MainPage from './Components/MainPage';
import JoinRoom from './Components/JoinRoom';
import CreateRoom from './Components/CreateRoom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <MainPage />
      },
      {
        path: '/CreateRoom',
        element: <CreateRoom />
      },
      {
        path: '/CreateRoom/:roomCode',
        element: <CreateRoom />
      },
      {
        path: '/JoinRoom/:roomCode',
        element: <JoinRoom />
      }
    ]
  }
]);


ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
