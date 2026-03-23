import { Server } from 'socket.io';

let io: Server | null = null;

export function setSocketIO(instance: Server) {
  io = instance;
}

export function getSocketIO(): Server | null {
  return io;
}

// Emitir evento para todos os clientes de um município
export function emitToMunicipality(municipalityId: number, event: string, data: any) {
  if (io) {
    io.to(`municipality:${municipalityId}`).emit(event, data);
  }
}

// Emitir evento para um usuário específico (chat, notificações diretas)
export function emitToUser(userId: number, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}
