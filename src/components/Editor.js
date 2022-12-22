import React, { useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Editor() {
  useEffect(() => {
    const roomid= window.prompt("Enter your roomid");
    const username = window.prompt("Enter your username");

    socket.emit("join-room", roomid, username);

    socket.on("user-connected", (userId) => {
      console.log("user joined", userId);
    });

    socket.on("user-disconnected", (userId) => {
      console.log("user left", userId);
    });
  }, []);

  return <input type={"text"}></input>;
}
