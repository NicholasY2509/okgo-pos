import 'package:flutter/foundation.dart';
import '../models/face_profile.dart';
import '../repositories/face_profile_repository.dart';
import '../services/face_embedding_service.dart';

/// Filter tabs for the staff face biometric roster.
enum StaffFaceFilter {
  all,
  registered,
  unregistered,
}

/// Record of a completed biometric verification for a room service session.
@immutable
class VerifiedSessionRecord {
  const VerifiedSessionRecord({
    required this.sessionId,
    required this.staffId,
    required this.staffName,
    required this.similarityScore,
    required this.verifiedAt,
  });

  final String sessionId;
  final String staffId;
  final String staffName;
  final double similarityScore;
  final DateTime verifiedAt;

  int get similarityPercent =>
      (similarityScore.clamp(0.0, 1.0) * 100).round();
}

/// State controller managing branch staff face embeddings, registration,
/// 1:1 / 1:N verification, and session verification status.
class StaffFaceController extends ChangeNotifier {
  StaffFaceController({
    FaceProfileRepository? repository,
    FaceEmbeddingService? embeddingService,
  })  : _repository = repository ?? PortalFaceProfileRepository(),
        _embeddingService = embeddingService ?? FaceEmbeddingService();

  final FaceProfileRepository _repository;
  final FaceEmbeddingService _embeddingService;

  String? _activeBranchId;
  List<StaffFaceProfile> _profiles = const <StaffFaceProfile>[];
  bool _isLoading = false;
  bool _isSaving = false;
  String? _errorMessage;
  String _searchQuery = '';
  StaffFaceFilter _filter = StaffFaceFilter.all;

  final Map<String, VerifiedSessionRecord> _verifiedSessions =
      <String, VerifiedSessionRecord>{};

  List<StaffFaceProfile> get profiles => _profiles;
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  StaffFaceFilter get filter => _filter;

  int get totalCount => _profiles.length;
  int get registeredCount =>
      _profiles.where((p) => p.hasFaceRegistered).length;
  int get unregisteredCount =>
      _profiles.where((p) => !p.hasFaceRegistered).length;

  List<StaffFaceProfile> get registeredProfiles =>
      _profiles.where((p) => p.hasFaceRegistered).toList(growable: false);

  List<StaffFaceProfile> get filteredProfiles {
    final query = _searchQuery.trim().toLowerCase();
    return _profiles.where((profile) {
      final matchesFilter = switch (_filter) {
        StaffFaceFilter.all => true,
        StaffFaceFilter.registered => profile.hasFaceRegistered,
        StaffFaceFilter.unregistered => !profile.hasFaceRegistered,
      };
      if (!matchesFilter) return false;
      if (query.isEmpty) return true;

      final nameMatch = profile.name.toLowerCase().contains(query);
      final idMatch =
          (profile.staffIdNumber ?? '').toLowerCase().contains(query);
      final posMatch = profile.position.toLowerCase().contains(query);
      return nameMatch || idMatch || posMatch;
    }).toList(growable: false);
  }

  /// Loads branch staff face profiles from the server (with local cache fallback).
  Future<void> loadProfiles(
    String branchId, {
    bool forceRefresh = false,
  }) async {
    final trimmed = branchId.trim();
    if (trimmed.isEmpty) return;

    if (!forceRefresh && _activeBranchId == trimmed && _profiles.isNotEmpty) {
      return;
    }

    _activeBranchId = trimmed;
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    // Load cached profiles first for instant UI responsiveness
    final cached = await _repository.loadCachedProfiles(trimmed);
    if (cached.isNotEmpty && _profiles.isEmpty) {
      _profiles = cached;
      notifyListeners();
    }

    try {
      final fresh = await _repository.fetchBranchStaffFaces(trimmed);
      _profiles = fresh;
      _errorMessage = null;
    } catch (e) {
      if (_profiles.isEmpty) {
        _errorMessage = e.toString();
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Registers or updates a staff member's 192D face embedding vector.
  Future<StaffFaceProfile?> registerStaffFace({
    required String branchId,
    required String staffId,
    required List<double> embedding,
  }) async {
    _isSaving = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final normalized = _embeddingService.normalizeVector(embedding);
      final updated = await _repository.registerStaffFace(
        branchId: branchId,
        staffId: staffId,
        embedding: normalized,
      );

      final updatedList = List<StaffFaceProfile>.from(_profiles);
      final idx = updatedList.indexWhere((p) => p.id == updated.id);
      if (idx >= 0) {
        updatedList[idx] = updated;
      } else {
        updatedList.add(updated);
      }
      _profiles = List<StaffFaceProfile>.unmodifiable(updatedList);
      return updated;
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  /// Evaluates 1:1 verification of [liveEmbedding] against [targetStaff].
  FaceMatchResult verifyStaffFace({
    required StaffFaceProfile targetStaff,
    required List<double> liveEmbedding,
    double? thresholdOverride,
  }) {
    return _embeddingService.verifyOneToOne(
      liveEmbedding: liveEmbedding,
      targetStaff: targetStaff,
      thresholdOverride: thresholdOverride,
    );
  }

  /// Evaluates 1:N identification of [liveEmbedding] across all registered branch staff.
  FaceMatchResult identifyStaffFace({
    required List<double> liveEmbedding,
    double? thresholdOverride,
  }) {
    return _embeddingService.identifyOneToMany(
      liveEmbedding: liveEmbedding,
      candidates: _profiles,
      thresholdOverride: thresholdOverride,
    );
  }

  /// Finds the corresponding [StaffFaceProfile] by [staffId] or [staffName].
  StaffFaceProfile? findProfile({String? staffId, String? staffName}) {
    if (staffId != null && staffId.trim().isNotEmpty) {
      final targetId = staffId.trim();
      for (final p in _profiles) {
        if (p.id == targetId) return p;
      }
    }
    if (staffName != null && staffName.trim().isNotEmpty) {
      final targetName = staffName.trim().toLowerCase();
      for (final p in _profiles) {
        if (p.name.toLowerCase() == targetName) return p;
      }
    }
    return null;
  }

  /// Records that a room session's assigned therapist has been biometrically verified.
  void markSessionVerified({
    required String sessionId,
    required StaffFaceProfile staff,
    required double similarityScore,
  }) {
    _verifiedSessions[sessionId] = VerifiedSessionRecord(
      sessionId: sessionId,
      staffId: staff.id,
      staffName: staff.name,
      similarityScore: similarityScore,
      verifiedAt: DateTime.now(),
    );
    notifyListeners();
  }

  VerifiedSessionRecord? getSessionVerification(String sessionId) =>
      _verifiedSessions[sessionId];

  void setSearchQuery(String query) {
    if (_searchQuery == query) return;
    _searchQuery = query;
    notifyListeners();
  }

  void setFilter(StaffFaceFilter newFilter) {
    if (_filter == newFilter) return;
    _filter = newFilter;
    notifyListeners();
  }

  void clear() {
    _activeBranchId = null;
    _profiles = const <StaffFaceProfile>[];
    _verifiedSessions.clear();
    _searchQuery = '';
    _filter = StaffFaceFilter.all;
    _errorMessage = null;
    notifyListeners();
  }
}

