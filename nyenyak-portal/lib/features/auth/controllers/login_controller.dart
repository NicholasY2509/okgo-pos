import 'package:flutter/foundation.dart';
import '../models/login_credentials.dart';
import '../services/auth_service.dart';

/// Manages presentation state for the Nyenyak Portal login flow.
class LoginController extends ChangeNotifier {
  LoginController({required AuthService authService})
      : _authService = authService;

  final AuthService _authService;

  bool _isSubmitting = false;
  bool _obscurePassword = true;
  String? _errorMessage;
  AuthSession? _session;

  bool get isSubmitting => _isSubmitting;
  bool get obscurePassword => _obscurePassword;
  String? get errorMessage => _errorMessage;
  AuthSession? get session => _session;
  PortalBranch? get activeBranch => _session?.branch;
  bool get isAuthenticated => _session != null;

  void togglePasswordVisibility() {
    _obscurePassword = !_obscurePassword;
    notifyListeners();
  }

  void clearError() {
    if (_errorMessage != null) {
      _errorMessage = null;
      notifyListeners();
    }
  }

  Future<bool> submit({
    required String email,
    required String password,
  }) async {
    if (_isSubmitting) {
      return false;
    }

    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _authService.login(
      LoginCredentials(
        email: email,
        password: password,
      ),
    );

    _isSubmitting = false;

    if (result.isSuccess && result.session != null) {
      _session = result.session;
      notifyListeners();
      return true;
    }

    _errorMessage = result.errorMessage ?? 'Gagal masuk ke akun Anda.';
    notifyListeners();
    return false;
  }

  /// Hydrates a previously persisted [AuthSession] from local device storage.
  Future<AuthSession?> restoreSession() async {
    final savedSession = await _authService.restoreSession();
    if (savedSession != null) {
      _session = savedSession;
      _errorMessage = null;
      notifyListeners();
    }
    return _session;
  }

  Future<void> signOut() async {
    await _authService.logout();
    _session = null;
    _errorMessage = null;
    notifyListeners();
  }
}

