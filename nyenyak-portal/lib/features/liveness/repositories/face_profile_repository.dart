import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/config/api_config.dart';
import '../models/face_profile.dart';

/// Contract for fetching, caching, and saving staff biometric face profiles.
abstract class FaceProfileRepository {
  Future<List<StaffFaceProfile>> fetchBranchStaffFaces(String branchId);
  Future<StaffFaceProfile> registerStaffFace({
    required String branchId,
    required String staffId,
    required List<double> embedding,
  });
  Future<List<StaffFaceProfile>> loadCachedProfiles(String branchId);
}

/// Exception thrown when face profile synchronization fails.
class FaceProfileRepositoryException implements Exception {
  const FaceProfileRepositoryException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// REST + SharedPreferences implementation of [FaceProfileRepository].
class PortalFaceProfileRepository implements FaceProfileRepository {
  PortalFaceProfileRepository({
    http.Client? httpClient,
    String? baseUrl,
  })  : _httpClient = httpClient ?? http.Client(),
        _baseUrl = baseUrl;

  final http.Client _httpClient;
  final String? _baseUrl;

  static const Duration _requestTimeout = Duration(seconds: 12);
  static const String _cacheKeyPrefix = 'nyenyak_portal_staff_faces_';

  String _cacheKey(String branchId) => '$_cacheKeyPrefix$branchId';

  Uri _buildFacesUri([String? branchId]) {
    return ApiConfig.resolve(
      ApiConfig.portalStaffFacesPath,
      baseUrlOverride: _baseUrl,
      queryParameters: (branchId != null && branchId.isNotEmpty)
          ? <String, String>{'branchId': branchId}
          : null,
    );
  }

  @override
  Future<List<StaffFaceProfile>> fetchBranchStaffFaces(String branchId) async {
    final trimmedBranchId = branchId.trim();
    if (trimmedBranchId.isEmpty) {
      return const <StaffFaceProfile>[];
    }

    try {
      final response = await _httpClient
          .get(
            _buildFacesUri(trimmedBranchId),
            headers: const <String, String>{'Accept': 'application/json'},
          )
          .timeout(_requestTimeout);

      final Map<String, dynamic> decoded =
          jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final rawList = decoded['data'];
        if (rawList is! List) {
          return await loadCachedProfiles(trimmedBranchId);
        }

        final profiles = rawList
            .whereType<Map<String, dynamic>>()
            .map(StaffFaceProfile.fromJson)
            .toList(growable: false);

        await _saveCachedProfiles(trimmedBranchId, profiles);
        return profiles;
      }

      final errorMsg = (decoded['error'] as String?)?.trim() ??
          'Gagal memuat data wajah staf (${response.statusCode}).';
      throw FaceProfileRepositoryException(errorMsg);
    } catch (e) {
      // Fallback to local cache if network is unreachable
      final cached = await loadCachedProfiles(trimmedBranchId);
      if (cached.isNotEmpty) {
        return cached;
      }
      if (e is FaceProfileRepositoryException) rethrow;
      throw const FaceProfileRepositoryException(
        'Tidak dapat terhubung ke server untuk memuat data wajah staf.',
      );
    }
  }

  @override
  Future<StaffFaceProfile> registerStaffFace({
    required String branchId,
    required String staffId,
    required List<double> embedding,
  }) async {
    final trimmedBranchId = branchId.trim();
    final trimmedStaffId = staffId.trim();

    try {
      final response = await _httpClient
          .post(
            _buildFacesUri(),
            headers: const <String, String>{
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode(<String, dynamic>{
              'branchId': trimmedBranchId,
              'staffId': trimmedStaffId,
              'embedding': embedding,
            }),
          )
          .timeout(_requestTimeout);

      final Map<String, dynamic> decoded =
          jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = decoded['data'];
        if (data is Map<String, dynamic>) {
          final updated = StaffFaceProfile.fromJson(data);
          await _upsertCachedProfile(trimmedBranchId, updated);
          return updated;
        }
      }

      final errorMsg = (decoded['error'] as String?)?.trim() ??
          'Gagal menyimpan registrasi wajah (${response.statusCode}).';
      throw FaceProfileRepositoryException(errorMsg);
    } on TimeoutException {
      throw const FaceProfileRepositoryException(
        'Waktu koneksi habis saat menyimpan data wajah ke server.',
      );
    } on FaceProfileRepositoryException {
      rethrow;
    } catch (_) {
      // If offline, update cached profile if present so local verification still works
      final cached = await loadCachedProfiles(trimmedBranchId);
      final idx = cached.indexWhere((p) => p.id == trimmedStaffId);
      if (idx >= 0) {
        final localUpdated = cached[idx].copyWith(
          hasFaceRegistered: true,
          faceEmbedding: embedding,
          faceRegisteredAt: DateTime.now(),
        );
        await _upsertCachedProfile(trimmedBranchId, localUpdated);
        return localUpdated;
      }
      throw const FaceProfileRepositoryException(
        'Gagal menyimpan data wajah ke server. Periksa koneksi jaringan.',
      );
    }
  }

  @override
  Future<List<StaffFaceProfile>> loadCachedProfiles(String branchId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawJson = prefs.getString(_cacheKey(branchId));
      if (rawJson == null || rawJson.isEmpty) {
        return const <StaffFaceProfile>[];
      }
      final decoded = jsonDecode(rawJson);
      if (decoded is! List) return const <StaffFaceProfile>[];
      return decoded
          .whereType<Map<String, dynamic>>()
          .map(StaffFaceProfile.fromJson)
          .toList(growable: false);
    } catch (_) {
      return const <StaffFaceProfile>[];
    }
  }

  Future<void> _saveCachedProfiles(
    String branchId,
    List<StaffFaceProfile> profiles,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final serialized = jsonEncode(profiles.map((p) => p.toJson()).toList());
      await prefs.setString(_cacheKey(branchId), serialized);
    } catch (_) {
      // Ignore storage write errors in restricted environments
    }
  }

  Future<void> _upsertCachedProfile(
    String branchId,
    StaffFaceProfile updated,
  ) async {
    final current = List<StaffFaceProfile>.from(
      await loadCachedProfiles(branchId),
    );
    final idx = current.indexWhere((p) => p.id == updated.id);
    if (idx >= 0) {
      current[idx] = updated;
    } else {
      current.add(updated);
    }
    await _saveCachedProfiles(branchId, current);
  }
}
