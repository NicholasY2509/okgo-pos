import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/config/api_config.dart';
import '../models/portal_room.dart';

/// Contract for fetching rooms and room sessions belonging to a branch.
abstract interface class RoomRepository {
  Future<List<PortalRoom>> getRoomsByBranch(String branchId);
  Future<List<RoomServiceSession>> getRoomSessions({
    required String branchId,
    required String roomId,
    DateTime? date,
  });
  Future<void> updateSessionStatus({
    required String sessionId,
    required String branchId,
    required String action,
    required String staffId,
  });
  Future<void> saveSelectedRoom(PortalRoom room);
  Future<PortalRoom?> getSavedRoom();
  Future<void> clearSavedRoom();
}

/// Exception thrown when loading branch rooms or room sessions fails.
class RoomRepositoryException implements Exception {
  const RoomRepositoryException(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Default room repository backed by the Nyenyak POS REST API.
class PortalRoomRepository implements RoomRepository {
  PortalRoomRepository({
    http.Client? httpClient,
    String? baseUrl,
  })  : _httpClient = httpClient ?? http.Client(),
        _baseUrl = baseUrl;

  static const String selectedRoomStorageKey = 'nyenyak_portal.selected_room';

  final http.Client _httpClient;
  final String? _baseUrl;

  @override
  Future<List<PortalRoom>> getRoomsByBranch(String branchId) async {
    final uri = ApiConfig.resolve(
      ApiConfig.portalRoomsPath,
      baseUrlOverride: _baseUrl,
      queryParameters: <String, String>{'branchId': branchId},
    );

    final response = await _performGet(
      uri,
      timeoutMessage:
          'Waktu koneksi ke server habis saat memuat daftar ruangan.',
      networkMessage:
          'Tidak dapat terhubung ke server Nyenyak POS untuk memuat ruangan.',
    );

    final payload = _decodeJsonMap(response.body);

    if (response.statusCode == 200 && payload != null) {
      final rawList = payload['data'];
      if (rawList is List<Object?>) {
        return rawList
            .whereType<Map<String, dynamic>>()
            .map(PortalRoom.fromJson)
            .toList();
      }
    }

    final serverError = payload?['error'];
    if (serverError is String && serverError.trim().isNotEmpty) {
      throw RoomRepositoryException(serverError.trim());
    }

    throw RoomRepositoryException(
      'Gagal memuat daftar ruangan (Status ${response.statusCode}).',
    );
  }

  @override
  Future<List<RoomServiceSession>> getRoomSessions({
    required String branchId,
    required String roomId,
    DateTime? date,
  }) async {
    final queryParams = <String, String>{'branchId': branchId};
    if (date != null) {
      final yyyy = date.year.toString().padLeft(4, '0');
      final mm = date.month.toString().padLeft(2, '0');
      final dd = date.day.toString().padLeft(2, '0');
      queryParams['date'] = '$yyyy-$mm-$dd';
    }

    final uri = ApiConfig.resolve(
      ApiConfig.portalRoomSessionsPath(roomId),
      baseUrlOverride: _baseUrl,
      queryParameters: queryParams,
    );

    final response = await _performGet(
      uri,
      timeoutMessage: 'Waktu koneksi habis saat memuat jadwal sesi ruangan.',
      networkMessage:
          'Tidak dapat terhubung ke server Nyenyak POS untuk memuat sesi ruangan.',
    );

    final payload = _decodeJsonMap(response.body);

    if (response.statusCode == 200 && payload != null) {
      final rawList = payload['data'];
      if (rawList is List<Object?>) {
        return rawList
            .whereType<Map<String, dynamic>>()
            .map(RoomServiceSession.fromJson)
            .toList();
      }
    }

    final serverError = payload?['error'];
    if (serverError is String && serverError.trim().isNotEmpty) {
      throw RoomRepositoryException(serverError.trim());
    }

    throw RoomRepositoryException(
      'Gagal memuat sesi ruangan (Status ${response.statusCode}).',
    );
  }

  @override
  Future<void> updateSessionStatus({
    required String sessionId,
    required String branchId,
    required String action,
    required String staffId,
  }) async {
    final uri = ApiConfig.resolve(
      ApiConfig.portalSessionStatusPath(sessionId),
      baseUrlOverride: _baseUrl,
    );

    final response = await _performPost(
      uri,
      body: jsonEncode(<String, dynamic>{
        'branchId': branchId,
        'action': action,
        'staffId': staffId,
      }),
      timeoutMessage:
          'Waktu koneksi habis saat memperbarui status sesi layanan.',
      networkMessage:
          'Tidak dapat terhubung ke server Nyenyak POS untuk memperbarui status sesi.',
    );

    final payload = _decodeJsonMap(response.body);

    if (response.statusCode == 200 && payload != null) {
      if (payload['success'] == true) {
        return;
      }
    }

    final serverError = payload?['error'];
    if (serverError is String && serverError.trim().isNotEmpty) {
      throw RoomRepositoryException(serverError.trim());
    }

    throw RoomRepositoryException(
      'Gagal memperbarui status sesi (Status ${response.statusCode}).',
    );
  }

  @override
  Future<void> saveSelectedRoom(PortalRoom room) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(selectedRoomStorageKey, jsonEncode(room.toJson()));
    } catch (_) {
      // Ignore storage errors in environments without platform channels.
    }
  }

  @override
  Future<PortalRoom?> getSavedRoom() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawJson = prefs.getString(selectedRoomStorageKey);
      if (rawJson == null || rawJson.trim().isEmpty) {
        return null;
      }
      final decoded = jsonDecode(rawJson);
      if (decoded is Map<String, dynamic>) {
        final room = PortalRoom.fromJson(decoded);
        if (room.id.isNotEmpty && room.branchId.isNotEmpty) {
          return room;
        }
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  @override
  Future<void> clearSavedRoom() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(selectedRoomStorageKey);
    } catch (_) {
      // Ignore storage errors in environments without platform channels.
    }
  }

  Future<http.Response> _performGet(
    Uri uri, {
    required String timeoutMessage,
    required String networkMessage,
  }) async {
    try {
      return await _httpClient
          .get(
            uri,
            headers: const <String, String>{
              'Accept': 'application/json',
            },
          )
          .timeout(ApiConfig.requestTimeout);
    } on TimeoutException {
      throw RoomRepositoryException(timeoutMessage);
    } catch (_) {
      throw RoomRepositoryException(networkMessage);
    }
  }

  Future<http.Response> _performPost(
    Uri uri, {
    required String body,
    required String timeoutMessage,
    required String networkMessage,
  }) async {
    try {
      return await _httpClient
          .post(
            uri,
            headers: const <String, String>{
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: body,
          )
          .timeout(ApiConfig.requestTimeout);
    } on TimeoutException {
      throw RoomRepositoryException(timeoutMessage);
    } catch (_) {
      throw RoomRepositoryException(networkMessage);
    }
  }

  Map<String, dynamic>? _decodeJsonMap(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
    } on FormatException {
      return null;
    }
    return null;
  }
}
