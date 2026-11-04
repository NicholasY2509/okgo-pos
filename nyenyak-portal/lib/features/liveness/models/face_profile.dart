import 'package:flutter/foundation.dart';

/// Operating mode for the camera liveness & face recognition pipeline.
enum FaceRecognitionMode {
  /// Passive liveness anti-spoofing check only.
  livenessOnly,

  /// Multi-sample face embedding registration for a target staff member.
  register,

  /// 1:1 face verification comparing live face against a target staff member's stored embedding.
  verifyOneToOne,

  /// 1:N face identification searching live face across all registered branch staff.
  identifyOneToMany,
}

/// Represents a staff member's biometric face registration profile.
@immutable
class StaffFaceProfile {
  const StaffFaceProfile({
    required this.id,
    required this.name,
    required this.firstName,
    required this.lastName,
    required this.position,
    required this.hasFaceRegistered,
    this.staffIdNumber,
    this.imageUrl,
    this.faceEmbedding,
    this.faceRegisteredAt,
  });

  factory StaffFaceProfile.fromJson(Map<String, dynamic> json) {
    List<double>? parsedEmbedding;
    final rawEmbedding = json['faceEmbedding'];
    if (rawEmbedding is List && rawEmbedding.isNotEmpty) {
      final values = <double>[];
      var valid = true;
      for (final item in rawEmbedding) {
        if (item is num && item.isFinite) {
          values.add(item.toDouble());
        } else {
          valid = false;
          break;
        }
      }
      if (valid && values.length >= 64) {
        parsedEmbedding = List<double>.unmodifiable(values);
      }
    }

    DateTime? parsedDate;
    final rawDate = json['faceRegisteredAt'];
    if (rawDate is String && rawDate.isNotEmpty) {
      parsedDate = DateTime.tryParse(rawDate)?.toLocal();
    }

    final firstName = (json['firstName'] as String?)?.trim() ?? '';
    final lastName = (json['lastName'] as String?)?.trim() ?? '';
    final fallbackName = '$firstName $lastName'.trim();
    final rawName = (json['name'] as String?)?.trim();
    final rawStaffIdNum = (json['staffIdNumber'] as String?)?.trim();
    final rawImageUrl = (json['imageUrl'] as String?)?.trim();

    return StaffFaceProfile(
      id: (json['id'] as String?)?.trim() ?? '',
      name: (rawName != null && rawName.isNotEmpty) ? rawName : fallbackName,
      firstName: firstName,
      lastName: lastName,
      staffIdNumber: (rawStaffIdNum != null && rawStaffIdNum.isNotEmpty)
          ? rawStaffIdNum
          : null,
      position: (json['position'] as String?)?.trim() ?? 'Staf',
      imageUrl:
          (rawImageUrl != null && rawImageUrl.isNotEmpty) ? rawImageUrl : null,
      hasFaceRegistered:
          json['hasFaceRegistered'] == true && parsedEmbedding != null,
      faceEmbedding: parsedEmbedding,
      faceRegisteredAt: parsedDate,
    );
  }

  final String id;
  final String name;
  final String firstName;
  final String lastName;
  final String? staffIdNumber;
  final String position;
  final String? imageUrl;
  final bool hasFaceRegistered;
  final List<double>? faceEmbedding;
  final DateTime? faceRegisteredAt;

  String get initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return 'S';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  StaffFaceProfile copyWith({
    String? id,
    String? name,
    String? firstName,
    String? lastName,
    String? staffIdNumber,
    String? position,
    String? imageUrl,
    bool? hasFaceRegistered,
    List<double>? faceEmbedding,
    DateTime? faceRegisteredAt,
  }) {
    return StaffFaceProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      staffIdNumber: staffIdNumber ?? this.staffIdNumber,
      position: position ?? this.position,
      imageUrl: imageUrl ?? this.imageUrl,
      hasFaceRegistered: hasFaceRegistered ?? this.hasFaceRegistered,
      faceEmbedding: faceEmbedding != null
          ? List<double>.unmodifiable(faceEmbedding)
          : this.faceEmbedding,
      faceRegisteredAt: faceRegisteredAt ?? this.faceRegisteredAt,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'firstName': firstName,
      'lastName': lastName,
      if (staffIdNumber != null) 'staffIdNumber': staffIdNumber,
      'position': position,
      if (imageUrl != null) 'imageUrl': imageUrl,
      'hasFaceRegistered': hasFaceRegistered,
      if (faceEmbedding != null) 'faceEmbedding': faceEmbedding,
      if (faceRegisteredAt != null)
        'faceRegisteredAt': faceRegisteredAt!.toUtc().toIso8601String(),
    };
  }
}

/// Result of comparing a live face embedding against one or more stored embeddings.
@immutable
class FaceMatchResult {
  const FaceMatchResult({
    required this.isMatched,
    required this.similarity,
    required this.euclideanDistance,
    this.matchedStaff,
  });

  /// Whether the cosine similarity meets or exceeds the verification threshold.
  final bool isMatched;

  /// Cosine similarity score in range [-1.0, 1.0] (1.0 = identical).
  final double similarity;

  /// L2 Euclidean distance between unit vectors.
  final double euclideanDistance;

  /// The matched staff profile when evaluating 1:1 or 1:N.
  final StaffFaceProfile? matchedStaff;

  /// Human-readable similarity percentage (0% - 100%).
  int get similarityPercent =>
      (similarity.clamp(0.0, 1.0) * 100).round();
}

