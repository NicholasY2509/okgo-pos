import 'dart:ui';
import 'face_profile.dart';

/// High-level lifecycle status of passive face liveness and recognition.
enum LivenessStatus {
  /// Initializing camera and ML models.
  initializing,

  /// Camera active, waiting for a single face to be detected.
  waitingForFace,

  /// Face detected, but too far from the camera guide oval.
  faceTooFar,

  /// Face detected, but too close to the camera.
  faceTooClose,

  /// Face is not properly centered inside the guide oval.
  faceOffCenter,

  /// Multiple faces detected in frame (security violation).
  multipleFacesDetected,

  /// Face is properly aligned; running passive anti-spoofing and embedding neural networks.
  analyzing,

  /// Face passed passive liveness checks (and matched identity if in verification mode).
  verified,

  /// Face passed liveness checks (genuine human), but does not match the registered face embedding.
  faceMismatch,

  /// Face failed anti-spoofing checks (2D photo, screen replay, or mask).
  spoofDetected,

  /// An unexpected error or camera failure occurred.
  error,
}

/// Result of passive liveness and face embedding evaluation for a frame or completed sequence.
class LivenessResult {
  const LivenessResult({
    required this.status,
    required this.isLive,
    required this.confidenceScore,
    required this.message,
    this.faceBoundingBox,
    this.capturedFrameBytes,
    this.extractedEmbedding,
    this.similarityScore,
    this.matchedStaff,
    this.capturedSamplesCount = 0,
    this.requiredSamplesCount = 3,
  });

  /// Current evaluation status.
  final LivenessStatus status;

  /// Whether the face passed genuine liveness threshold.
  final bool isLive;

  /// Neural network real-face probability (0.0 to 1.0).
  final double confidenceScore;

  /// Localized/user-friendly guidance message.
  final String message;

  /// Detected face bounding box in preview coordinates.
  final Rect? faceBoundingBox;

  /// Optional JPEG/PNG snapshot bytes of the verified real face.
  final List<int>? capturedFrameBytes;

  /// Extracted L2-normalized 192D face embedding vector when registration/verification completes.
  final List<double>? extractedEmbedding;

  /// Cosine similarity score (0.0 to 1.0) when comparing against stored staff embeddings.
  final double? similarityScore;

  /// Matched staff profile when verifying (1:1) or identifying (1:N).
  final StaffFaceProfile? matchedStaff;

  /// Number of live face samples collected so far.
  final int capturedSamplesCount;

  /// Total number of consecutive live face samples required.
  final int requiredSamplesCount;

  /// Factory helper for pending or guidance states.
  factory LivenessResult.guidance(
    LivenessStatus status,
    String message, {
    Rect? box,
    int capturedSamples = 0,
    int requiredSamples = 3,
  }) {
    return LivenessResult(
      status: status,
      isLive: false,
      confidenceScore: 0.0,
      message: message,
      faceBoundingBox: box,
      capturedSamplesCount: capturedSamples,
      requiredSamplesCount: requiredSamples,
    );
  }

  /// Factory helper for successful verification or registration.
  factory LivenessResult.verified({
    required double score,
    Rect? box,
    List<int>? snapshot,
    List<double>? embedding,
    double? similarity,
    StaffFaceProfile? matchedStaff,
    String? customMessage,
    int capturedSamples = 3,
    int requiredSamples = 3,
  }) {
    return LivenessResult(
      status: LivenessStatus.verified,
      isLive: true,
      confidenceScore: score,
      message: customMessage ?? 'Wajah terverifikasi asli',
      faceBoundingBox: box,
      capturedFrameBytes: snapshot,
      extractedEmbedding: embedding,
      similarityScore: similarity,
      matchedStaff: matchedStaff,
      capturedSamplesCount: capturedSamples,
      requiredSamplesCount: requiredSamples,
    );
  }

  /// Factory helper when a real live face does not match the registered identity.
  factory LivenessResult.mismatch({
    required double livenessScore,
    required double similarityScore,
    Rect? box,
    StaffFaceProfile? targetStaff,
    String? customMessage,
  }) {
    final pct = (similarityScore.clamp(0.0, 1.0) * 100).round();
    final defaultMsg = targetStaff != null
        ? 'Wajah tidak cocok dengan ${targetStaff.name} (Kemiripan $pct%)'
        : 'Wajah tidak dikenali pada data staf cabang (Kemiripan $pct%)';
    return LivenessResult(
      status: LivenessStatus.faceMismatch,
      isLive: true,
      confidenceScore: livenessScore,
      similarityScore: similarityScore,
      message: customMessage ?? defaultMsg,
      faceBoundingBox: box,
    );
  }

  /// Factory helper for detected spoof attack.
  factory LivenessResult.spoof({
    required double score,
    Rect? box,
  }) {
    return LivenessResult(
      status: LivenessStatus.spoofDetected,
      isLive: false,
      confidenceScore: score,
      message: 'Peringatan: Terdeteksi foto atau layar',
      faceBoundingBox: box,
    );
  }
}
