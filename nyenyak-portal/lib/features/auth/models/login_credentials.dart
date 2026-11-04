import 'package:flutter/foundation.dart';

/// Input schema and validation rules for Email & Password authentication.
///
/// Mirrors `modules/auth/schemas/login.ts` in the Nyenyak web application.
@immutable
class LoginCredentials {
  const LoginCredentials({
    required this.email,
    required this.password,
    this.branchSubdomain,
  });

  final String email;
  final String password;
  final String? branchSubdomain;

  static final RegExp _emailPattern = RegExp(
    r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$',
  );

  /// Validates the email field and returns a localized error message or `null`.
  static String? validateEmail(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty || !_emailPattern.hasMatch(trimmed)) {
      return 'Harap masukkan alamat email yang valid.';
    }
    return null;
  }

  /// Validates the password field and returns a localized error message or `null`.
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Kata sandi wajib diisi.';
    }
    return null;
  }

  bool get isValid =>
      validateEmail(email) == null && validatePassword(password) == null;

  /// Serializes credentials into JSON payload for `POST /api/portal/auth/login`.
  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'email': email,
      'password': password,
      if (branchSubdomain != null && branchSubdomain!.isNotEmpty)
        'subdomain': branchSubdomain,
    };
  }
}

/// Represents the branch/tenant bound to the authenticated portal session.
@immutable
class PortalBranch {
  const PortalBranch({
    required this.id,
    required this.name,
    required this.subdomain,
  });

  factory PortalBranch.fromJson(Map<String, dynamic> json) {
    final id = (json['id'] as String?)?.trim() ?? '';
    final name = (json['name'] as String?)?.trim() ?? '';
    final subdomain = (json['subdomain'] as String?)?.trim() ?? '';

    if (id.isEmpty || subdomain.isEmpty) {
      throw const FormatException(
        'Akun ini belum ditugaskan ke cabang mana pun.',
      );
    }

    return PortalBranch(
      id: id,
      name: name.isNotEmpty ? name : subdomain,
      subdomain: subdomain,
    );
  }

  final String id;
  final String name;
  final String subdomain;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'subdomain': subdomain,
    };
  }
}

/// Represents an authenticated portal user session bound to a specific [PortalBranch].
@immutable
class AuthSession {
  const AuthSession({
    required this.userId,
    required this.email,
    required this.displayName,
    required this.role,
    required this.branch,
    required this.authenticatedAt,
  });

  /// Deserializes the `data` object returned by `POST /api/portal/auth/login`.
  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final rawEmail = (json['email'] as String?)?.trim() ?? '';
    final rawName = (json['name'] as String?)?.trim() ?? '';
    final rawRole = json['role'];
    final roleName = switch (rawRole) {
      final String roleStr when roleStr.isNotEmpty => roleStr,
      {'name': final String nestedName} when nestedName.isNotEmpty =>
        nestedName,
      _ => 'Guest',
    };

    final rawBranch = json['branch'];
    if (rawBranch is! Map<String, dynamic>) {
      throw const FormatException(
        'Akun ini belum ditugaskan ke cabang mana pun.',
      );
    }

    final branch = PortalBranch.fromJson(rawBranch);
    final rawTimestamp = json['authenticatedAt'] as String?;

    return AuthSession(
      userId: (json['id'] as String?) ?? '',
      email: rawEmail,
      displayName: rawName.isNotEmpty ? rawName : rawEmail,
      role: roleName,
      branch: branch,
      authenticatedAt: rawTimestamp != null
          ? (DateTime.tryParse(rawTimestamp) ?? DateTime.now())
          : DateTime.now(),
    );
  }

  final String userId;
  final String email;
  final String displayName;
  final String role;
  final PortalBranch branch;
  final DateTime authenticatedAt;

  String get branchId => branch.id;
  String get branchName => branch.name;
  String get branchSubdomain => branch.subdomain;

  /// Serializes this session into JSON for persistent local device storage.
  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': userId,
      'email': email,
      'name': displayName,
      'role': role,
      'branch': branch.toJson(),
      'authenticatedAt': authenticatedAt.toIso8601String(),
    };
  }
}

/// Standardized result wrapper for authentication actions.
@immutable
class AuthResult {
  const AuthResult._({
    required this.isSuccess,
    this.session,
    this.errorMessage,
  });

  factory AuthResult.success(AuthSession session) {
    return AuthResult._(isSuccess: true, session: session);
  }

  factory AuthResult.failure(String message) {
    return AuthResult._(isSuccess: false, errorMessage: message);
  }

  final bool isSuccess;
  final AuthSession? session;
  final String? errorMessage;
}
