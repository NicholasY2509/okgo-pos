import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;
import 'package:tflite_flutter/tflite_flutter.dart';
import '../models/face_profile.dart';

/// Service for on-device face feature extraction (192D MobileFaceNet embeddings)
/// and biometric vector matching (1:1 verification and 1:N identification).
class FaceEmbeddingService {
  FaceEmbeddingService({
    this.modelAssetPath = 'assets/models/mobilefacenet.tflite',
    this.inputSize = 112,
    this.embeddingDimension = 192,
    this.matchThreshold = 0.75,
    Interpreter? interpreter,
  }) : _interpreter = interpreter;

  final String modelAssetPath;
  final int inputSize;
  final int embeddingDimension;
  final double matchThreshold;

  Interpreter? _interpreter;
  bool _isInitialized = false;
  bool _isFallbackMode = false;

  bool get isInitialized => _isInitialized;
  bool get isFallbackMode => _isFallbackMode;

  /// Loads the MobileFaceNet TFLite model with native hardware delegates.
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      final options = InterpreterOptions()..threads = 2;

      try {
        if (defaultTargetPlatform == TargetPlatform.android) {
          options.addDelegate(XNNPackDelegate());
        } else if (defaultTargetPlatform == TargetPlatform.iOS) {
          options.addDelegate(GpuDelegate());
        }
      } catch (delegateError) {
        debugPrint(
          'FaceEmbeddingService hardware delegate unavailable, using CPU: $delegateError',
        );
      }

      _interpreter = await Interpreter.fromAsset(
        modelAssetPath,
        options: options,
      );
      _isInitialized = true;
      _isFallbackMode = false;
    } catch (e) {
      debugPrint(
        'Notice: TFLite embedding model "$modelAssetPath" not loaded ($e). '
        'Operating in deterministic spatial-descriptor mode.',
      );
      _isInitialized = true;
      _isFallbackMode = true;
    }
  }

  /// Extracts an L2-normalized [embeddingDimension]-dimensional vector from [faceCrop].
  Future<List<double>> extractEmbedding(img.Image faceCrop) async {
    if (!_isInitialized) {
      await initialize();
    }

    if (_isFallbackMode || _interpreter == null) {
      return _extractSpatialDescriptor(faceCrop);
    }

    try {
      // 1. Resize aligned face crop to 112x112
      final resized = img.copyResize(
        faceCrop,
        width: inputSize,
        height: inputSize,
        interpolation: img.Interpolation.linear,
      );

      // 2. Normalize RGB pixels to [-1.0, 1.0]: (p - 127.5) / 128.0
      final inputTensor = List.generate(
        1,
        (_) => List.generate(
          inputSize,
          (y) => List.generate(
            inputSize,
            (x) {
              final pixel = resized.getPixel(x, y);
              return <double>[
                (pixel.r - 127.5) / 128.0,
                (pixel.g - 127.5) / 128.0,
                (pixel.b - 127.5) / 128.0,
              ];
            },
          ),
        ),
      );

      // 3. Allocate output tensor [1, embeddingDimension]
      final outputTensor = List.filled(
        1 * embeddingDimension,
        0.0,
      ).reshape([1, embeddingDimension]);

      // 4. Execute MobileFaceNet inference
      _interpreter!.run(inputTensor, outputTensor);

      // 5. Extract and L2-normalize output vector
      final rawVector = (outputTensor[0] as List)
          .map((v) => (v as num).toDouble())
          .toList(growable: false);

      return normalizeVector(rawVector);
    } catch (error) {
      debugPrint('Error during MobileFaceNet TFLite inference: $error');
      return _extractSpatialDescriptor(faceCrop);
    }
  }

  /// Deterministic 192D spatial luminance + gradient descriptor used when
  /// running in unit tests or simulator environments without the physical `.tflite` file.
  List<double> _extractSpatialDescriptor(img.Image faceCrop) {
    final resized = img.copyResize(
      faceCrop,
      width: 64,
      height: 64,
      interpolation: img.Interpolation.linear,
    );

    // Divide 64x64 face into an 8x8 grid (64 cells), extracting 3 features per cell:
    // 1. Mean luminance
    // 2. Horizontal gradient (gx)
    // 3. Vertical gradient (gy)
    // 64 cells * 3 channels = 192 features.
    final rawFeatures = <double>[];
    const gridCount = 8;
    const cellSize = 8;

    for (var gy = 0; gy < gridCount; gy++) {
      for (var gx = 0; gx < gridCount; gx++) {
        var sumLum = 0.0;
        var sumGradX = 0.0;
        var sumGradY = 0.0;
        var count = 0;

        final startY = gy * cellSize;
        final startX = gx * cellSize;

        for (var y = startY; y < startY + cellSize; y++) {
          for (var x = startX; x < startX + cellSize; x++) {
            final lum = _pixelLuminance(resized, x, y);
            final lumRight = _pixelLuminance(
              resized,
              math.min(x + 1, resized.width - 1),
              y,
            );
            final lumDown = _pixelLuminance(
              resized,
              x,
              math.min(y + 1, resized.height - 1),
            );

            sumLum += (lum - 127.5) / 128.0;
            sumGradX += (lumRight - lum) / 128.0;
            sumGradY += (lumDown - lum) / 128.0;
            count++;
          }
        }

        if (count > 0) {
          rawFeatures.add(sumLum / count);
          rawFeatures.add(sumGradX / count);
          rawFeatures.add(sumGradY / count);
        } else {
          rawFeatures.addAll(const <double>[0.0, 0.0, 0.0]);
        }
      }
    }

    // Pad or trim to exact embeddingDimension
    while (rawFeatures.length < embeddingDimension) {
      rawFeatures.add(0.0);
    }
    final sized = rawFeatures.sublist(0, embeddingDimension);
    return normalizeVector(sized);
  }

  double _pixelLuminance(img.Image image, int x, int y) {
    final p = image.getPixel(x, y);
    return 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;
  }

  /// Normalizes a vector to unit L2 length ($\|\mathbf{v}\|_2 = 1.0$).
  List<double> normalizeVector(List<double> vector) {
    if (vector.isEmpty) return const <double>[];

    var sumSq = 0.0;
    for (var i = 0; i < vector.length; i++) {
      sumSq += vector[i] * vector[i];
    }
    final norm = math.sqrt(sumSq);
    if (norm <= 1e-10 || !norm.isFinite) {
      // Fallback unit basis vector if input is all zeros
      return List<double>.generate(
        vector.length,
        (i) => i == 0 ? 1.0 : 0.0,
        growable: false,
      );
    }

    return List<double>.generate(
      vector.length,
      (i) => vector[i] / norm,
      growable: false,
    );
  }

  /// Computes the L2-normalized centroid (mean embedding) from multiple live samples.
  List<double> computeCentroid(List<List<double>> samples) {
    if (samples.isEmpty) {
      throw ArgumentError('Samples list cannot be empty.');
    }
    if (samples.length == 1) {
      return normalizeVector(samples.first);
    }

    final dim = samples.first.length;
    final mean = List<double>.filled(dim, 0.0);

    for (final sample in samples) {
      final limit = math.min(dim, sample.length);
      for (var i = 0; i < limit; i++) {
        mean[i] += sample[i];
      }
    }

    for (var i = 0; i < dim; i++) {
      mean[i] /= samples.length;
    }

    return normalizeVector(mean);
  }

  /// Computes the Cosine Similarity ($\frac{\mathbf{a} \cdot \mathbf{b}}{\|\mathbf{a}\|_2 \|\mathbf{b}\|_2}$)
  /// between two embedding vectors, returning a value in `[-1.0, 1.0]`.
  double cosineSimilarity(List<double> a, List<double> b) {
    final len = math.min(a.length, b.length);
    if (len == 0) return 0.0;

    var dot = 0.0;
    var normA = 0.0;
    var normB = 0.0;

    for (var i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    final denom = math.sqrt(normA) * math.sqrt(normB);
    if (denom <= 1e-10 || !denom.isFinite) return 0.0;

    return (dot / denom).clamp(-1.0, 1.0);
  }

  /// Computes the L2 Euclidean distance ($\|\mathbf{a} - \mathbf{b}\|_2$) between two vectors.
  double euclideanDistance(List<double> a, List<double> b) {
    final len = math.min(a.length, b.length);
    if (len == 0) return double.infinity;

    var sumSq = 0.0;
    for (var i = 0; i < len; i++) {
      final diff = a[i] - b[i];
      sumSq += diff * diff;
    }
    return math.sqrt(sumSq);
  }

  /// Evaluates 1:1 face verification against [targetStaff].
  FaceMatchResult verifyOneToOne({
    required List<double> liveEmbedding,
    required StaffFaceProfile targetStaff,
    double? thresholdOverride,
  }) {
    final stored = targetStaff.faceEmbedding;
    if (stored == null || stored.isEmpty) {
      return const FaceMatchResult(
        isMatched: false,
        similarity: 0.0,
        euclideanDistance: double.infinity,
      );
    }

    final threshold = thresholdOverride ?? matchThreshold;
    final similarity = cosineSimilarity(liveEmbedding, stored);
    final distance = euclideanDistance(liveEmbedding, stored);
    final matched = similarity >= threshold;

    return FaceMatchResult(
      isMatched: matched,
      similarity: similarity,
      euclideanDistance: distance,
      matchedStaff: matched ? targetStaff : null,
    );
  }

  /// Evaluates 1:N face identification across all [candidates] with registered embeddings.
  FaceMatchResult identifyOneToMany({
    required List<double> liveEmbedding,
    required List<StaffFaceProfile> candidates,
    double? thresholdOverride,
  }) {
    final threshold = thresholdOverride ?? matchThreshold;
    StaffFaceProfile? bestStaff;
    var bestSimilarity = -1.0;
    var bestDistance = double.infinity;

    for (final candidate in candidates) {
      final stored = candidate.faceEmbedding;
      if (!candidate.hasFaceRegistered || stored == null || stored.isEmpty) {
        continue;
      }

      final sim = cosineSimilarity(liveEmbedding, stored);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestDistance = euclideanDistance(liveEmbedding, stored);
        bestStaff = candidate;
      }
    }

    if (bestStaff == null || bestSimilarity < 0) {
      return const FaceMatchResult(
        isMatched: false,
        similarity: 0.0,
        euclideanDistance: double.infinity,
      );
    }

    final isMatched = bestSimilarity >= threshold;
    return FaceMatchResult(
      isMatched: isMatched,
      similarity: bestSimilarity,
      euclideanDistance: bestDistance,
      matchedStaff: isMatched ? bestStaff : null,
    );
  }

  Future<void> dispose() async {
    _interpreter?.close();
    _interpreter = null;
    _isInitialized = false;
  }
}

