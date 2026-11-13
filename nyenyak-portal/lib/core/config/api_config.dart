import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Centralized API endpoint and environment configuration for Nyenyak Portal.
///
/// Reads configuration from `nyenyak-portal/.env` via `flutter_dotenv` (loaded in
/// `main()` via [ApiConfig.loadEnv]), with optional compile-time overrides via
/// `--dart-define=NYENYAK_API_BASE_URL=...` and `--dart-define=NYENYAK_SOCKET_URL=...`.
abstract final class ApiConfig {
  static const String _dartDefineBaseUrl = String.fromEnvironment(
    'NYENYAK_API_BASE_URL',
  );
  static const String _dartDefineSocketUrl = String.fromEnvironment(
    'NYENYAK_SOCKET_URL',
  );

  static const String portalLoginPath = '/api/portal/auth/login';
  static const String portalRoomsPath = '/api/portal/rooms';
  static const String portalStaffFacesPath = '/api/portal/staff/faces';

  static String portalSessionStatusPath(String sessionId) =>
      '/api/portal/sessions/$sessionId/status';

  static String portalRoomSessionsPath(String roomId) =>
      '/api/portal/rooms/$roomId/sessions';

  static const Duration requestTimeout = Duration(seconds: 15);

  /// Loads environment variables from `.env` asset file using `flutter_dotenv`.
  ///
  /// Uses `isOptional: true` so widget/unit tests or builds without a `.env` file
  /// gracefully fall back to default local URLs.
  static Future<void> loadEnv({String fileName = '.env'}) async {
    try {
      await dotenv.load(fileName: fileName, isOptional: true);
    } catch (_) {
      // Ignore asset loading errors in non-bundled test environments.
    }
  }

  static String? _readEnv(String key) {
    if (!dotenv.isInitialized) return null;
    final value = dotenv.maybeGet(key)?.trim();
    if (value == null || value.isEmpty) return null;
    return value;
  }

  /// Returns the configured base URL for the Nyenyak POS backend.
  ///
  /// Priority:
  /// 1. `--dart-define=NYENYAK_API_BASE_URL`
  /// 2. `.env` `NYENYAK_API_BASE_URL`
  /// 3. Default `http://localhost:3000`
  static String get baseUrl {
    if (_dartDefineBaseUrl.isNotEmpty) {
      return _normalizeBaseUrl(_dartDefineBaseUrl);
    }

    final dotEnvBaseUrl = _readEnv('NYENYAK_API_BASE_URL');
    if (dotEnvBaseUrl != null) {
      return _normalizeBaseUrl(dotEnvBaseUrl);
    }

    return 'http://localhost:3000';
  }

  /// Returns the Socket.io server URL for real-time room session updates.
  ///
  /// Priority:
  /// 1. `--dart-define=NYENYAK_SOCKET_URL`
  /// 2. `.env` `NYENYAK_SOCKET_URL`
  /// 3. Derived from configured `NYENYAK_API_BASE_URL` (mapping `:3000` to `:3001`)
  /// 4. Default `http://localhost:3001`
  static String get socketUrl {
    if (_dartDefineSocketUrl.isNotEmpty) {
      return _normalizeBaseUrl(_dartDefineSocketUrl);
    }

    final dotEnvSocketUrl = _readEnv('NYENYAK_SOCKET_URL');
    if (dotEnvSocketUrl != null) {
      return _normalizeBaseUrl(dotEnvSocketUrl);
    }

    final configuredBase = _dartDefineBaseUrl.isNotEmpty
        ? _dartDefineBaseUrl
        : _readEnv('NYENYAK_API_BASE_URL');
    if (configuredBase != null && configuredBase.isNotEmpty) {
      final normalized = _normalizeBaseUrl(configuredBase);
      if (normalized.endsWith(':3000')) {
        return '${normalized.substring(0, normalized.length - 5)}:3001';
      }
      return normalized;
    }

    return 'http://localhost:3001';
  }

  /// Resolves an endpoint path against [baseUrl] or an optional [baseUrlOverride].
  static Uri resolve(
    String path, {
    String? baseUrlOverride,
    Map<String, String>? queryParameters,
  }) {
    final effectiveBase = baseUrlOverride != null && baseUrlOverride.isNotEmpty
        ? _normalizeBaseUrl(baseUrlOverride)
        : baseUrl;
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse('$effectiveBase$normalizedPath');
    if (queryParameters != null && queryParameters.isNotEmpty) {
      return uri.replace(queryParameters: queryParameters);
    }
    return uri;
  }

  static String _normalizeBaseUrl(String raw) {
    final trimmed = raw.trim();
    if (trimmed.endsWith('/')) {
      return trimmed.substring(0, trimmed.length - 1);
    }
    return trimmed;
  }
}
