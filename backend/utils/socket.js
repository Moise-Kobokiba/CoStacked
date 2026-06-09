// Simple socket helper to allow controllers to access the Socket.IO instance
let ioInstance = null;

module.exports = {
  init(io) {
    ioInstance = io;
  },
  getIo() {
    return ioInstance;
  }
};
