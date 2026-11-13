import { Server } from "socket.io";

const port = process.env.SOCKET_PORT || 3001;

const io = new Server(port, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("join_branch", (branchId) => {
    if (branchId) {
      socket.join(String(branchId));
    }
  });

  socket.on("join_room", (roomId) => {
    if (roomId) {
      socket.join(`room:${String(roomId)}`);
    }
  });

  socket.on("leave_room", (roomId) => {
    if (roomId) {
      socket.leave(`room:${String(roomId)}`);
    }
  });

  socket.on("service_assigned", (data) => {
    if (data?.roomId) {
      io.to(`room:${String(data.roomId)}`).emit("service_assigned", data);
    }
    if (data?.branchId) {
      io.to(String(data.branchId)).emit("service_assigned", data);
    }
    io.emit("service_assigned", data);
  });

  socket.on("service_status_changed", (data) => {
    if (data?.roomId) {
      io.to(`room:${String(data.roomId)}`).emit("service_status_changed", data);
    }
    if (data?.branchId) {
      io.to(String(data.branchId)).emit("service_status_changed", data);
    }
    io.emit("service_status_changed", data);
  });

  socket.on("new_booking", (data) => {
    if (data?.roomId) {
      io.to(`room:${String(data.roomId)}`).emit("new_booking", data);
    }
    if (data?.branchId) {
      io.to(String(data.branchId)).emit("new_booking", data);
    }
    io.emit("new_booking", data);
  });

  socket.on("disconnect", () => {
    // Disconnected
  });
});

console.log(`> Socket.io server ready on port ${port}`);
