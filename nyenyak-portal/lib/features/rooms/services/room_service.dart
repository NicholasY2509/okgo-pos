import '../models/portal_room.dart';
import '../repositories/room_repository.dart';

/// Business logic layer for querying rooms and arranged room sessions in a branch.
class RoomService {
  const RoomService(this._repository);

  final RoomRepository _repository;

  Future<RoomListResult> getRoomsForBranch(String branchId) async {
    final trimmedBranchId = branchId.trim();
    if (trimmedBranchId.isEmpty) {
      return RoomListResult.failure('ID cabang wajib diisi.');
    }

    try {
      final rooms = await _repository.getRoomsByBranch(trimmedBranchId);
      return RoomListResult.success(rooms);
    } on RoomRepositoryException catch (error) {
      return RoomListResult.failure(error.message);
    } catch (_) {
      return RoomListResult.failure(
        'Terjadi kesalahan saat memuat daftar ruangan cabang.',
      );
    }
  }

  Future<RoomSessionListResult> getSessionsForRoom({
    required String branchId,
    required String roomId,
    DateTime? date,
  }) async {
    final trimmedBranchId = branchId.trim();
    final trimmedRoomId = roomId.trim();

    if (trimmedBranchId.isEmpty || trimmedRoomId.isEmpty) {
      return RoomSessionListResult.failure(
        'ID cabang dan ruangan wajib diisi.',
      );
    }

    try {
      final sessions = await _repository.getRoomSessions(
        branchId: trimmedBranchId,
        roomId: trimmedRoomId,
        date: date,
      );
      return RoomSessionListResult.success(sessions);
    } on RoomRepositoryException catch (error) {
      return RoomSessionListResult.failure(error.message);
    } catch (_) {
      return RoomSessionListResult.failure(
        'Terjadi kesalahan saat memuat jadwal sesi ruangan.',
      );
    }
  }

  Future<void> updateSessionStatus({
    required String sessionId,
    required String branchId,
    required String action,
    required String staffId,
  }) async {
    await _repository.updateSessionStatus(
      sessionId: sessionId,
      branchId: branchId,
      action: action,
      staffId: staffId,
    );
  }

  Future<void> saveSelectedRoom(PortalRoom room) async {
    await _repository.saveSelectedRoom(room);
  }

  Future<PortalRoom?> getSavedRoom() async {
    return _repository.getSavedRoom();
  }

  Future<void> clearSavedRoom() async {
    await _repository.clearSavedRoom();
  }
}
