import { Server } from "socket.io";

const port = process.env.SOCKET_PORT || 3001;

const io = new Server(port, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("A user connected to socket server:", socket.id);

  socket.on("service_assigned", (data) => {
    console.log("Service assigned event received:", data);
    io.emit("service_assigned", data);
  });

  socket.on("service_status_changed", (data) => {
    console.log("Service status changed event received:", data);
    io.emit("service_status_changed", data);
  });

  socket.on("new_booking", (data) => {
    console.log("New booking event received:", data);
    io.emit("new_booking", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

console.log(`> Socket.io server ready on port ${port}`);
