import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import exp from "constants";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  let currentRoom = null;
  let currentUser = null;


  socket.on("join", ({ roomId, userName }) => {
    
    
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentUser);

      // Inform all users in the previous room that a user left
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }

   
    currentRoom = roomId;
    currentUser = userName;
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    // Add the current user to the room
    rooms.get(roomId).add(userName);

    // Emit updated list of users to the room

    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)));
  });

  
  socket.on("codeChange", ({ roomId, code }) => {
    socket.to(roomId).emit("codeUpdate", code);
  });

  
  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom)?.delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom) || []));
      socket.leave(currentRoom);
      currentRoom = null;
      currentUser = null;
    }
  });

  socket.on("typing",({roomId,userName})=>{
    console.log("Received typing event:", { roomId, userName });
    socket.to(roomId).emit("UserTyping",userName);
  })

  socket.on("languageChange",({roomId,language})=>{
    io.to(roomId).emit("languageUpdate",language)
  })

  socket.on("disconnect", () => {
    if (currentRoom && rooms.get(currentRoom)) {
      rooms.get(currentRoom).delete(currentUser);

      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }
    console.log("userDisconnected")
  });
});

const port = process.env.PORT || 5000;
const __dirname=path.resolve();
app.use(express.static(path.join(__dirname,'frontend', 'vite-project', 'dist')))
app.get("*",(req,res)=>{
    res.sendFile(path.join(__dirname,'frontend', 'vite-project', 'dist','index.html'))
})
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
