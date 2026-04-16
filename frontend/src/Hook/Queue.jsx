import { useEffect } from "react";
import socket from "../Services/Socket";

export const useQueueSocket = (handlers) => {
  useEffect(() => {
    socket.on("queue_update", handlers.onQueueUpdate);
    socket.on("ticket_assigned", handlers.onTicketAssigned);
    socket.on("ticket_called", handlers.onTicketCalled);

    return () => {
      socket.off("queue_update", handlers.onQueueUpdate);
      socket.off("ticket_assigned", handlers.onTicketAssigned);
      socket.off("ticket_called", handlers.onTicketCalled);
    };
  }, []);
};