import '../models/login_credentials.dart';
import '../repositories/auth_repository.dart';

/// Business logic layer for Nyenyak Portal authentication.
///
/// Validates input rules and orchestrates [AuthRepository] calls.
class AuthService {
  const AuthService(this._repository);

  final AuthRepository _repository;

  Future<AuthResult> login(LoginCredentials credentials) async {
    final emailError = LoginCredentials.validateEmail(credentials.email);
    if (emailError != null) {
      return AuthResult.failure(emailError);
    }

    final passwordError = LoginCredentials.validatePassword(
      credentials.password,
    );
    if (passwordError != null) {
      return AuthResult.failure(passwordError);
    }

    try {
      final normalized = LoginCredentials(
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        branchSubdomain: credentials.branchSubdomain?.trim(),
      );
      final session = await _repository.signInWithEmailAndPassword(normalized);
      return AuthResult.success(session);
    } on AuthRepositoryException catch (error) {
      return AuthResult.failure(error.message);
    } catch (_) {
      return AuthResult.failure(
        'Terjadi kesalahan saat menghubungi server. Silakan coba lagi.',
      );
    }
  }

  Future<AuthSession?> restoreSession() async {
    return _repository.getSavedSession();
  }

  Future<void> logout() async {
    await _repository.signOut();
  }
}

