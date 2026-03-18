"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSocketIO = setSocketIO;
exports.getSocketIO = getSocketIO;
exports.emitToMunicipality = emitToMunicipality;
let io = null;
function setSocketIO(instance) {
    io = instance;
}
function getSocketIO() {
    return io;
}
// Emitir evento para todos os clientes de um município
function emitToMunicipality(municipalityId, event, data) {
    if (io) {
        io.to(`municipality:${municipalityId}`).emit(event, data);
    }
}
