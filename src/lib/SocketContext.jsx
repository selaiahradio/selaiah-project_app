
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { appParams } from "./app-params";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

// The socket server URL should ideally be in an environment variable
const SOCKET_URL = "https://us-central1-selaiah-radio.cloudfunctions.net";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const token = appParams.token;

  useEffect(() => {
    // Initialize socket connection with authentication
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"]
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket.IO connected successfully.');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
