import React, { createContext } from 'react';
import { useSocket } from '../hooks/useSocket';

export const SocketContext = createContext();

export const SocketProvider = ( { children } ) => {
  const { online, socket } = useSocket( 'http://localhost:8080' );

  return (
    <SocketContext.Provider value={{ online, socket }}>
      { children }
    </SocketContext.Provider>
  )
}