import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/config/api_config.dart';
import '../models/login_credentials.dart';

/// Contract for authentication data access and session persistence.
abstract interface class AuthRepository {
  Future<AuthSession> signInWithEmailAndPassword(LoginCredentials credentials);
  Future<AuthSession?> getSavedSession();
  Future<void> signOut();
}

/// Exception thrown when authentication fails due to invalid credentials or server rejection.
class AuthRepositoryException implements Exception {
  const AuthRepositoryException(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Default portal authentication repository backed by the Nyenyak POS REST API.
///
/// Verifies credentials via `POST /api/portal/auth/login` against `AuthService.verifyCredentials`
/// in `nyenyak-pos`, binds the resulting session to the user's assigned branch,
/// and persists the session locally until [signOut] is called.
class PortalAuthRepository implements AuthRepository {
  PortalAuthRepository({
    http.Client? httpClient,
    String? baseUrl,
  })  : _httpClient = httpClient ?? http.Client(),
        _baseUrl = baseUrl;

  static const String sessionStorageKey = 'nyenyak_portal.auth_session';

  final http.Client _httpClient;
  final String? _baseUrl;

  @override
  Future<AuthSession> signInWithEmailAndPassword(
    LoginCredentials credentials,
  ) async {
    final uri = ApiConfig.resolve(
      ApiConfig.portalLoginPath,
      baseUrlOverride: _baseUrl,
    );

    http.Response response;
    try {
      response = await _httpClient
          .post(
            uri,
            headers: const <String, String>{
              'Content-Type': 'application/json; charset=UTF-8',
              'Accept': 'application/json',
            },
            body: jsonEncode(credentials.toJson()),
          )
          .timeout(ApiConfig.requestTimeout);
    } on TimeoutException {
      throw const AuthRepositoryException(
        'Waktu koneksi ke server habis. Silakan periksa jaringan Anda.',
      );
    } catch (_) {
      throw const AuthRepositoryException(
        'Tidak dapat terhubung ke server Nyenyak POS. Pastikan server aktif.',
      );
    }

    Map<String, dynamic>? payload;
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        payload = decoded;
      }
    } on FormatException {
      payload = null;
    }

    if (response.statusCode == 200 && payload != null) {
      final data = payload['data'];
      if (data is Map<String, dynamic>) {
        try {
          final session = AuthSession.fromJson(data);
          await _persistSession(session);
          return session;
        } on FormatException catch (error) {
          throw AuthRepositoryException(error.message);
        }
      }
    }

    final serverError = payload?['error'];
    if (serverError is String && serverError.trim().isNotEmpty) {
      throw AuthRepositoryException(serverError.trim());
    }

    throw AuthRepositoryException(
      'Gagal memverifikasi akun (Status ${response.statusCode}).',
    );
  }

  @override
  Future<AuthSession?> getSavedSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawJson = prefs.getString(sessionStorageKey);
      if (rawJson == null || rawJson.trim().isEmpty) {
        return null;
      }
      final decoded = jsonDecode(rawJson);
      if (decoded is Map<String, dynamic>) {
        return AuthSession.fromJson(decoded);
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  Future<void> _persistSession(AuthSession session) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(sessionStorageKey, jsonEncode(session.toJson()));
    } catch (_) {
      // Ignore storage errors in environments without platform channels.
    }
  }

  @override
  Future<void> signOut() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(sessionStorageKey);
    } catch (_) {
      // Ignore storage errors in environments without platform channels.
    }
  }
}
