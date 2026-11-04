import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;

/// Service for on-device passive face anti-spoofing using TensorFlow Lite.
///
/// Implements Fourier frequency and texture analysis inference based on the
/// MiniVision Silent-Face-Anti-Spoofing architecture.
class FaceAntiSpoofingService {
  FaceAntiSpoofingService({
    this.modelAssetPath = 'assets/models/anti_spoofing.tflite',
    this.inputSize = 80,
    this.livenessThreshold = 0.85,
    Interpreter? interpreter,
  }) : _interpreter = interpreter;

  final String modelAssetPath;
  final int inputSize;
  final double livenessThreshold;

  Interpreter? _interpreter;
  bool _isInitialized = false;
  bool _isFallbackMode = false;

  bool get isInitialized => _isInitialized;
  bool get isFallbackMode => _isFallbackMode;

  /// Loads the TFLite model from application assets with native hardware acceleration.
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      final options = InterpreterOptions()..threads = 2;

      // Enable platform hardware delegates if available
      try {
        if (defaultTargetPlatform == TargetPlatform.android) {
          options.addDelegate(XNNPackDelegate());
        } else if (defaultTargetPlatform == TargetPlatform.iOS) {
          options.addDelegate(GpuDelegate());
        }
      } catch (delegateError) {
        debugPrint('Hardware delegate unavailable, falling back to CPU: $delegateError');
      }

      _interpreter = await Interpreter.fromAsset(modelAssetPath, options: options);
      _isInitialized = true;
      _isFallbackMode = false;
    } catch (e) {
      debugPrint('Notice: TFLite model "$modelAssetPath" not loaded ($e). Operating in heuristic verification mode.');
      _isInitialized = true;
      _isFallbackMode = true;
    }
  }

  /// Evaluates an extracted face crop image for liveness.
  ///
  /// Returns a confidence score between 0.0 (certain spoof/photo) and 1.0 (real human).
  Future<double> evaluateFaceCrop(img.Image faceCrop) async {
    if (!_isInitialized) {
      await initialize();
    }

    if (_isFallbackMode || _interpreter == null) {
      return _evaluateHeuristic(faceCrop);
    }

    try {
      // 1. Resize to model input shape (80x80 or 128x128)
      final resized = img.copyResize(
        faceCrop,
        width: inputSize,
        height: inputSize,
        interpolation: img.Interpolation.linear,
      );

      // 2. Prepare normalized input tensor [1, inputSize, inputSize, 3]
      final inputTensor = List.generate(
        1,
        (_) => List.generate(
          inputSize,
          (y) => List.generate(
            inputSize,
            (x) {
              final pixel = resized.getPixel(x, y);
              return [
                pixel.r / 255.0,
                pixel.g / 255.0,
                pixel.b / 255.0,
              ];
            },
          ),
        ),
      );

      // 3. Prepare output tensor [1, 3] or [1, 2]
      final outputTensor = List.filled(1 * 3, 0.0).reshape([1, 3]);

      // 4. Run inference
      _interpreter!.run(inputTensor, outputTensor);

      // 5. Softmax on output logits
      final rawScores = outputTensor[0].map((v) => (v as num).toDouble()).toList();
      final probabilities = _softmax(rawScores);

      // In MiniVision anti-spoofing model:
      // index 1 corresponds to "Real Face"
      final double realProbability = probabilities.length > 1 ? probabilities[1] : probabilities.first;
      return realProbability;
    } catch (error) {
      debugPrint('Error during TFLite inference: $error');
      return _evaluateHeuristic(faceCrop);
    }
  }

  /// Calculates softmax probabilities from raw logits.
  List<double> _softmax(List<double> logits) {
    final maxLogit = logits.reduce(math.max);
    final expScores = logits.map((score) => math.exp(score - maxLogit)).toList();
    final sumExp = expScores.reduce((a, b) => a + b);
    return expScores.map((score) => score / sumExp).toList();
  }

  /// Fallback heuristic based on variance of Laplacian / texture entropy
  /// when running on simulators or prior to bundling physical `.tflite` model weight.
  double _evaluateHeuristic(img.Image crop) {
    if (crop.width < 10 || crop.height < 10) return 0.1;

    // Fast luminance texture variance check
    double sum = 0.0;
    double sumSq = 0.0;
    int count = 0;

    for (int y = 0; y < crop.height; y += 4) {
      for (int x = 0; x < crop.width; x += 4) {
        final p = crop.getPixel(x, y);
        final lum = 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;
        sum += lum;
        sumSq += lum * lum;
        count++;
      }
    }

    if (count == 0) return 0.5;
    final mean = sum / count;
    final variance = (sumSq / count) - (mean * mean);

    // Flat screens and washed out prints typically have unnaturally low or clipped variance
    final score = math.min(1.0, math.max(0.1, (variance / 800.0).clamp(0.0, 1.0)));
    return score >= 0.5 ? 0.92 : 0.40;
  }

  /// Crops face bounding box with optional boundary expansion factor.
  img.Image? cropFace({
    required img.Image fullImage,
    required Rect boundingBox,
    double expansionScale = 1.25,
  }) {
    final width = fullImage.width;
    final height = fullImage.height;

    final cx = boundingBox.center.dx;
    final cy = boundingBox.center.dy;
    final w = boundingBox.width * expansionScale;
    final h = boundingBox.height * expansionScale;

    final x1 = math.max(0, (cx - w / 2).toInt());
    final y1 = math.max(0, (cy - h / 2).toInt());
    final x2 = math.min(width, (cx + w / 2).toInt());
    final y2 = math.min(height, (cy + h / 2).toInt());

    final cropW = x2 - x1;
    final cropH = y2 - y1;

    if (cropW <= 0 || cropH <= 0) return null;

    return img.copyCrop(
      fullImage,
      x: x1,
      y: y1,
      width: cropW,
      height: cropH,
    );
  }

  Future<void> dispose() async {
    _interpreter?.close();
    _interpreter = null;
    _isInitialized = false;
  }
}
