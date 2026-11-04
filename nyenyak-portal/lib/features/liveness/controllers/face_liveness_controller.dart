import 'dart:async';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:image/image.dart' as img;
import '../models/face_profile.dart';
import '../models/liveness_result.dart';
import '../services/face_anti_spoofing_service.dart';
import '../services/face_detector_service.dart';
import '../services/face_embedding_service.dart';

/// State controller orchestrating real-time camera streaming, face tracking,
/// passive anti-spoofing verification, and 192D MobileFaceNet face registration/verification.
class FaceLivenessController extends ChangeNotifier {
  FaceLivenessController({
    FaceDetectorService? detectorService,
    FaceAntiSpoofingService? antiSpoofingService,
    FaceEmbeddingService? embeddingService,
    this.mode = FaceRecognitionMode.livenessOnly,
    this.targetStaff,
    this.candidateProfiles = const <StaffFaceProfile>[],
    this.requiredConsecutivePasses = 3,
    this.frameThrottleMs = 120,
  })  : _detectorService = detectorService ?? FaceDetectorService(),
        _antiSpoofingService = antiSpoofingService ?? FaceAntiSpoofingService(),
        _embeddingService = embeddingService ?? FaceEmbeddingService();

  final FaceDetectorService _detectorService;
  final FaceAntiSpoofingService _antiSpoofingService;
  final FaceEmbeddingService _embeddingService;
  final FaceRecognitionMode mode;
  final StaffFaceProfile? targetStaff;
  final List<StaffFaceProfile> candidateProfiles;
  final int requiredConsecutivePasses;
  final int frameThrottleMs;

  CameraController? _cameraController;
  CameraDescription? _camera;
  bool _isProcessingFrame = false;
  int _lastProcessedTimestamp = 0;

  int _consecutivePasses = 0;
  int _consecutiveSpoofs = 0;
  int _consecutiveMismatches = 0;
  InputImageRotation? _workingRotation;
  int _rotationProbeIndex = 0;
  final List<List<double>> _collectedEmbeddings = <List<double>>[];

  LivenessResult _result = const LivenessResult(
    status: LivenessStatus.initializing,
    isLive: false,
    confidenceScore: 0.0,
    message: 'Memulai kamera...',
  );

  CameraController? get cameraController => _cameraController;
  CameraDescription? get camera => _camera;
  LivenessResult get result => _result;
  bool get isCompleted =>
      _result.status == LivenessStatus.verified ||
      _result.status == LivenessStatus.spoofDetected ||
      _result.status == LivenessStatus.faceMismatch;

  /// Initializes the front camera and ML models.
  Future<void> initialize({List<CameraDescription>? camerasOverride}) async {
    _updateResult(
      LivenessResult.guidance(
        LivenessStatus.initializing,
        'Menyiapkan modul verifikasi...',
        requiredSamples: requiredConsecutivePasses,
      ),
    );

    try {
      final cameras = camerasOverride ?? await availableCameras();
      if (cameras.isEmpty) {
        _updateResult(
          LivenessResult.guidance(
            LivenessStatus.error,
            'Tidak ada kamera yang ditemukan',
          ),
        );
        return;
      }

      // Select front-facing camera if available
      final frontCamera = cameras.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      _camera = frontCamera;

      final controller = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: Platform.isAndroid
            ? ImageFormatGroup.nv21
            : ImageFormatGroup.bgra8888,
      );

      _cameraController = controller;
      await controller.initialize();
      await _antiSpoofingService.initialize();
      if (mode != FaceRecognitionMode.livenessOnly) {
        await _embeddingService.initialize();
      }

      // Start stream
      await controller.startImageStream(_onCameraFrame);

      _updateResult(
        LivenessResult.guidance(
          LivenessStatus.waitingForFace,
          'Posisikan wajah di dalam lingkaran',
          requiredSamples: requiredConsecutivePasses,
        ),
      );
    } catch (e) {
      debugPrint('FaceLivenessController initialization error: $e');
      _updateResult(
        LivenessResult.guidance(
          LivenessStatus.error,
          'Gagal mengakses kamera: $e',
        ),
      );
    }
  }

  /// Processes camera frame stream.
  void _onCameraFrame(CameraImage image) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    if (_isProcessingFrame ||
        isCompleted ||
        (now - _lastProcessedTimestamp < frameThrottleMs)) {
      return;
    }

    _isProcessingFrame = true;
    _lastProcessedTimestamp = now;

    try {
      if (_camera == null || _cameraController == null) return;

      final deviceOrientation = _cameraController!.value.deviceOrientation;
      final defaultRotation = _detectorService.computeRotation(
            camera: _camera!,
            deviceOrientation: deviceOrientation,
          ) ??
          InputImageRotation.rotation0deg;

      const allRotations = <InputImageRotation>[
        InputImageRotation.rotation0deg,
        InputImageRotation.rotation270deg,
        InputImageRotation.rotation90deg,
        InputImageRotation.rotation180deg,
      ];

      final activeRotation = _workingRotation ??
          (_rotationProbeIndex == 0
              ? defaultRotation
              : allRotations[_rotationProbeIndex % allRotations.length]);

      final inputImage = _detectorService.buildInputImageFromCamera(
        image: image,
        camera: _camera!,
        deviceOrientation: deviceOrientation,
        rotationOverride: activeRotation,
      );

      if (inputImage == null) {
        _isProcessingFrame = false;
        return;
      }

      final faces = await _detectorService.detectFaces(inputImage);

      if (faces.isEmpty) {
        _workingRotation = null;
        _rotationProbeIndex = (_rotationProbeIndex + 1) % (allRotations.length + 1);
        _resetFrameCounters();
        _updateResult(
          LivenessResult.guidance(
            LivenessStatus.waitingForFace,
            'Posisikan wajah di dalam lingkaran',
            requiredSamples: requiredConsecutivePasses,
          ),
        );
        _isProcessingFrame = false;
        return;
      }

      _workingRotation = activeRotation;

      if (faces.length > 1) {
        _resetFrameCounters();
        _updateResult(
          LivenessResult.guidance(
            LivenessStatus.multipleFacesDetected,
            'Hanya satu orang diperbolehkan',
            requiredSamples: requiredConsecutivePasses,
          ),
        );
        _isProcessingFrame = false;
        return;
      }

      final face = faces.first;
      final isSwappedDimensions =
          activeRotation == InputImageRotation.rotation90deg ||
          activeRotation == InputImageRotation.rotation270deg;
      final previewSize = isSwappedDimensions
          ? Size(image.height.toDouble(), image.width.toDouble())
          : Size(image.width.toDouble(), image.height.toDouble());

      // Target centered oval boundary
      final targetOval = Rect.fromCenter(
        center: Offset(previewSize.width / 2, previewSize.height / 2),
        width: previewSize.width * 0.65,
        height: previewSize.height * 0.65,
      );

      // Alignment check
      final alignmentIssue = _detectorService.checkFaceAlignment(
        face: face,
        previewSize: previewSize,
        targetOval: targetOval,
      );

      if (alignmentIssue != null) {
        _consecutivePasses = 0;
        _updateResult(
          LivenessResult.guidance(
            LivenessStatus.faceOffCenter,
            alignmentIssue,
            box: face.boundingBox,
            capturedSamples: _collectedEmbeddings.length,
            requiredSamples: requiredConsecutivePasses,
          ),
        );
        _isProcessingFrame = false;
        return;
      }

      // Face is centered: run passive anti-spoofing + feature extraction
      final analyzingMessage = switch (mode) {
        FaceRecognitionMode.register =>
          'Merekam fitur wajah (${_collectedEmbeddings.length + 1}/$requiredConsecutivePasses)...',
        FaceRecognitionMode.verifyOneToOne =>
          'Memverifikasi wajah ${targetStaff?.name ?? 'staf'}...',
        FaceRecognitionMode.identifyOneToMany =>
          'Mengidentifikasi wajah staf...',
        FaceRecognitionMode.livenessOnly => 'Memverifikasi keaslian wajah...',
      };

      _updateResult(
        LivenessResult.guidance(
          LivenessStatus.analyzing,
          analyzingMessage,
          box: face.boundingBox,
          capturedSamples: _collectedEmbeddings.length,
          requiredSamples: requiredConsecutivePasses,
        ),
      );

      // Convert frame for anti-spoofing and embedding crop
      final fullImage = _convertCameraImageToRgb(image, activeRotation);
      if (fullImage == null) {
        _isProcessingFrame = false;
        return;
      }

      final faceCrop = _antiSpoofingService.cropFace(
        fullImage: fullImage,
        boundingBox: face.boundingBox,
      );

      if (faceCrop == null) {
        _isProcessingFrame = false;
        return;
      }

      final livenessScore = await _antiSpoofingService.evaluateFaceCrop(faceCrop);

      if (livenessScore >= _antiSpoofingService.livenessThreshold) {
        _consecutiveSpoofs = 0;
        await _evaluateLiveFaceCrop(
          faceCrop: faceCrop,
          livenessScore: livenessScore,
          boundingBox: face.boundingBox,
        );
      } else if (livenessScore < 0.45) {
        _consecutiveSpoofs++;
        _consecutivePasses = 0;

        if (_consecutiveSpoofs >= 3) {
          _updateResult(
            LivenessResult.spoof(
              score: livenessScore,
              box: face.boundingBox,
            ),
          );
          await _cameraController?.stopImageStream();
        }
      } else {
        // Borderline score: continue collecting frames
        _consecutivePasses = 0;
      }
    } catch (e) {
      debugPrint('Error evaluating camera frame for liveness/recognition: $e');
    } finally {
      _isProcessingFrame = false;
    }
  }

  /// Evaluates a live-verified face crop according to the active [mode].
  Future<void> _evaluateLiveFaceCrop({
    required img.Image faceCrop,
    required double livenessScore,
    required Rect boundingBox,
  }) async {
    switch (mode) {
      case FaceRecognitionMode.livenessOnly:
        _consecutivePasses++;
        if (_consecutivePasses >= requiredConsecutivePasses) {
          final snapshotBytes = img.encodeJpg(faceCrop, quality: 85);
          _updateResult(
            LivenessResult.verified(
              score: livenessScore,
              box: boundingBox,
              snapshot: snapshotBytes,
              capturedSamples: _consecutivePasses,
              requiredSamples: requiredConsecutivePasses,
            ),
          );
          await _cameraController?.stopImageStream();
        }

      case FaceRecognitionMode.register:
        final alignedCrop = _antiSpoofingService.cropFace(
              fullImage: faceCrop,
              boundingBox: Rect.fromLTWH(
                0,
                0,
                faceCrop.width.toDouble(),
                faceCrop.height.toDouble(),
              ),
              expansionScale: 1.0,
            ) ??
            faceCrop;

        final embedding = await _embeddingService.extractEmbedding(alignedCrop);
        _collectedEmbeddings.add(embedding);
        _consecutivePasses = _collectedEmbeddings.length;

        if (_collectedEmbeddings.length >= requiredConsecutivePasses) {
          final centroid = _embeddingService.computeCentroid(
            _collectedEmbeddings,
          );
          final snapshotBytes = img.encodeJpg(faceCrop, quality: 85);
          final staffLabel = targetStaff?.name ?? 'Staf';

          _updateResult(
            LivenessResult.verified(
              score: livenessScore,
              box: boundingBox,
              snapshot: snapshotBytes,
              embedding: centroid,
              matchedStaff: targetStaff,
              customMessage: 'Data wajah $staffLabel berhasil direkam',
              capturedSamples: _collectedEmbeddings.length,
              requiredSamples: requiredConsecutivePasses,
            ),
          );
          await _cameraController?.stopImageStream();
        } else {
          _updateResult(
            LivenessResult.guidance(
              LivenessStatus.analyzing,
              'Merekam sampel wajah (${_collectedEmbeddings.length}/$requiredConsecutivePasses)...',
              box: boundingBox,
              capturedSamples: _collectedEmbeddings.length,
              requiredSamples: requiredConsecutivePasses,
            ),
          );
        }

      case FaceRecognitionMode.verifyOneToOne:
        final liveEmbedding = await _embeddingService.extractEmbedding(faceCrop);
        final target = targetStaff;
        if (target == null || !target.hasFaceRegistered) {
          _updateResult(
            LivenessResult.guidance(
              LivenessStatus.error,
              'Data wajah staf belum terdaftar.',
              box: boundingBox,
            ),
          );
          await _cameraController?.stopImageStream();
          return;
        }

        final matchResult = _embeddingService.verifyOneToOne(
          liveEmbedding: liveEmbedding,
          targetStaff: target,
        );

        if (matchResult.isMatched) {
          _consecutivePasses++;
          _consecutiveMismatches = 0;

          if (_consecutivePasses >= 2) {
            final snapshotBytes = img.encodeJpg(faceCrop, quality: 85);
            _updateResult(
              LivenessResult.verified(
                score: livenessScore,
                box: boundingBox,
                snapshot: snapshotBytes,
                embedding: liveEmbedding,
                similarity: matchResult.similarity,
                matchedStaff: target,
                customMessage:
                    'Terverifikasi: ${target.name} (${matchResult.similarityPercent}%)',
                capturedSamples: _consecutivePasses,
                requiredSamples: 2,
              ),
            );
            await _cameraController?.stopImageStream();
          }
        } else {
          _consecutiveMismatches++;
          _consecutivePasses = 0;

          if (_consecutiveMismatches >= 3) {
            _updateResult(
              LivenessResult.mismatch(
                livenessScore: livenessScore,
                similarityScore: matchResult.similarity,
                box: boundingBox,
                targetStaff: target,
              ),
            );
            await _cameraController?.stopImageStream();
          }
        }

      case FaceRecognitionMode.identifyOneToMany:
        final liveEmbedding = await _embeddingService.extractEmbedding(faceCrop);
        final matchResult = _embeddingService.identifyOneToMany(
          liveEmbedding: liveEmbedding,
          candidates: candidateProfiles,
        );

        if (matchResult.isMatched && matchResult.matchedStaff != null) {
          _consecutivePasses++;
          _consecutiveMismatches = 0;

          if (_consecutivePasses >= 2) {
            final snapshotBytes = img.encodeJpg(faceCrop, quality: 85);
            final matched = matchResult.matchedStaff!;
            _updateResult(
              LivenessResult.verified(
                score: livenessScore,
                box: boundingBox,
                snapshot: snapshotBytes,
                embedding: liveEmbedding,
                similarity: matchResult.similarity,
                matchedStaff: matched,
                customMessage:
                    'Teridentifikasi: ${matched.name} (${matchResult.similarityPercent}%)',
                capturedSamples: _consecutivePasses,
                requiredSamples: 2,
              ),
            );
            await _cameraController?.stopImageStream();
          }
        } else {
          _consecutiveMismatches++;
          _consecutivePasses = 0;

          if (_consecutiveMismatches >= 3) {
            _updateResult(
              LivenessResult.mismatch(
                livenessScore: livenessScore,
                similarityScore: matchResult.similarity,
                box: boundingBox,
              ),
            );
            await _cameraController?.stopImageStream();
          }
        }
    }
  }

  void _resetFrameCounters({bool clearEmbeddings = false}) {
    _consecutivePasses = 0;
    _consecutiveSpoofs = 0;
    _consecutiveMismatches = 0;
    if (clearEmbeddings) {
      _collectedEmbeddings.clear();
    }
  }

  /// Converts a [CameraImage] into an [img.Image] rotated to [rotation] for cropping and inference.
  img.Image? _convertCameraImageToRgb(
    CameraImage image,
    InputImageRotation rotation,
  ) {
    try {
      final width = image.width;
      final height = image.height;
      final rgbImage = img.Image(width: width, height: height);

      if (image.format.group == ImageFormatGroup.bgra8888) {
        final bytes = image.planes.first.bytes;
        int srcIndex = 0;
        for (int y = 0; y < height; y++) {
          for (int x = 0; x < width; x++) {
            final b = bytes[srcIndex];
            final g = bytes[srcIndex + 1];
            final r = bytes[srcIndex + 2];
            rgbImage.setPixelRgb(x, y, r, g, b);
            srcIndex += 4;
          }
        }
      } else if (image.planes.length >= 3) {
        // 3-plane YUV_420_888 conversion with chroma
        final yPlane = image.planes[0];
        final uPlane = image.planes[1];
        final vPlane = image.planes[2];
        final yBytes = yPlane.bytes;
        final uBytes = uPlane.bytes;
        final vBytes = vPlane.bytes;
        final yRowStride = yPlane.bytesPerRow;
        final uvRowStride = uPlane.bytesPerRow;
        final uvPixelStride = uPlane.bytesPerPixel ?? 1;

        for (int y = 0; y < height; y++) {
          final yRowOffset = y * yRowStride;
          final uvRowOffset = (y >> 1) * uvRowStride;
          for (int x = 0; x < width; x++) {
            final yIdx = yRowOffset + x;
            final uvIdx = uvRowOffset + (x >> 1) * uvPixelStride;
            final yVal = yIdx < yBytes.length ? yBytes[yIdx] : 0;
            final uVal = (uvIdx < uBytes.length ? uBytes[uvIdx] : 128) - 128;
            final vVal = (uvIdx < vBytes.length ? vBytes[uvIdx] : 128) - 128;

            final r = (yVal + 1.370705 * vVal).round().clamp(0, 255);
            final g = (yVal - 0.337633 * uVal - 0.698001 * vVal)
                .round()
                .clamp(0, 255);
            final b = (yVal + 1.732446 * uVal).round().clamp(0, 255);
            rgbImage.setPixelRgb(x, y, r, g, b);
          }
        }
      } else {
        // Single-plane NV21 fallback
        final yPlane = image.planes[0].bytes;
        final yRowStride = image.planes[0].bytesPerRow;
        for (int y = 0; y < height; y++) {
          final rowOffset = y * yRowStride;
          for (int x = 0; x < width; x++) {
            final idx = rowOffset + x;
            final yVal = idx < yPlane.length ? yPlane[idx] : 0;
            rgbImage.setPixelRgb(x, y, yVal, yVal, yVal);
          }
        }
      }

      return switch (rotation) {
        InputImageRotation.rotation90deg => img.copyRotate(rgbImage, angle: 90),
        InputImageRotation.rotation180deg =>
          img.copyRotate(rgbImage, angle: 180),
        InputImageRotation.rotation270deg =>
          img.copyRotate(rgbImage, angle: 270),
        InputImageRotation.rotation0deg => rgbImage,
      };
    } catch (e) {
      debugPrint('Camera image conversion error: $e');
      return null;
    }
  }

  void _updateResult(LivenessResult newResult) {
    _result = newResult;
    notifyListeners();
  }

  /// Resets state and resumes active detection stream.
  Future<void> reset() async {
    _resetFrameCounters(clearEmbeddings: true);
    _isProcessingFrame = false;

    _updateResult(
      LivenessResult.guidance(
        LivenessStatus.waitingForFace,
        'Posisikan wajah di dalam lingkaran',
        requiredSamples: requiredConsecutivePasses,
      ),
    );

    if (_cameraController != null &&
        !_cameraController!.value.isStreamingImages) {
      await _cameraController!.startImageStream(_onCameraFrame);
    }
  }

  @override
  void dispose() {
    _cameraController?.stopImageStream();
    _cameraController?.dispose();
    _detectorService.dispose();
    _antiSpoofingService.dispose();
    _embeddingService.dispose();
    super.dispose();
  }
}
