// const express = require('express');
// const { v4: uuidv4 } = require('uuid');
// const morgan = require('morgan');
// const http = require('http');
// const { Server } = require("socket.io");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// // Thiết lập middleware
// app.use(morgan('dev')); // Sử dụng morgan để ghi log
// app.use(express.static(`${__dirname}/../public`)); // Đặt thư mục public là static

// // Thiết lập view engine là EJS
// app.set('view engine', 'ejs');
// app.set('views', `${__dirname}/views`);

// // Route gốc, tạo UUID và chuyển hướng đến phòng mới
// app.get('/', (req, res) => {
//     res.redirect(`/${uuidv4()}`);
// });

// // Route cho phòng cụ thể, render view với roomId
// app.get('/:roomId', (req, res) => {
//     res.render('room', { roomId: req.params.roomId });
// });

// // Socket.io logic
// io.on('connection', socket => {
//     socket.on('join-room', (roomId, userId) => {
//         socket.join(roomId);
//         socket.broadcast.to(roomId).emit('user-connected', userId);

//         socket.on('disconnect', () => {
//             socket.broadcast.to(roomId).emit('user-disconnected', userId);
//         });
//     });
// });

// // Khởi động server
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//     console.log(`App listening on PORT: ${PORT}`);
// });
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware setup
app.use(morgan("dev")); // Use morgan for logging
app.use(express.static(`${__dirname}/../public`)); // Serve static files from public directory
app.use(cors());

// Set view engine to EJS
app.set("view engine", "ejs");
app.set("views", `${__dirname}/views`);

// Root route, generate UUID and redirect to new room
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

// Route for specific room, render view with roomId
app.get("/:roomId", (req, res) => {
  res.render("room", { roomId: req.params.roomId });
});

// Socket.io logic
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });
  });
});

// Khởi động server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`App listening on PORT: ${PORT}`);
});
