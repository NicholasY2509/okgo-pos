import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

/// Service responsible for fast on-device face localization and alignment verification.
class FaceDetectorService {
  FaceDetectorService({FaceDetector? detector})
      : _detector = detector ??
            FaceDetector(
              options: FaceDetectorOptions(
                performanceMode: FaceDetectorMode.fast,
                enableClassification: false,
                enableLandmarks: false,
                enableTracking: false,
                minFaceSize: 0.12,
              ),
            );

  final FaceDetector _detector;

  /// Detects faces in an [InputImage].
  Future<List<Face>> detectFaces(InputImage inputImage) async {
    return _detector.processImage(inputImage);
  }

  /// Computes the default [InputImageRotation] for a camera sensor and device orientation.
  InputImageRotation? computeRotation({
    required CameraDescription camera,
    required DeviceOrientation deviceOrientation,
  }) {
    final sensorOrientation = camera.sensorOrientation;
    if (Platform.isAndroid) {
      var rotationCompensation = _orientations[deviceOrientation];
      if (rotationCompensation == null) return null;
      if (camera.lensDirection == CameraLensDirection.front) {
        rotationCompensation =
            (sensorOrientation + rotationCompensation) % 360;
      } else {
        rotationCompensation =
            (sensorOrientation - rotationCompensation + 360) % 360;
      }
      return InputImageRotationValue.fromRawValue(rotationCompensation);
    } else if (Platform.isIOS) {
      return InputImageRotationValue.fromRawValue(sensorOrientation);
    }
    return InputImageRotation.rotation0deg;
  }

  /// Converts a [CameraImage] into an ML Kit [InputImage].
  ///
  /// On Android Camera2 devices that stream 3-plane `YUV_420_888` (`format.raw == 35`),
  /// automatically converts the planes into a contiguous `NV21` buffer (`format 17`)
  /// required by Android's `InputImage.fromByteArray`.
  InputImage? buildInputImageFromCamera({
    required CameraImage image,
    required CameraDescription camera,
    required DeviceOrientation deviceOrientation,
    InputImageRotation? rotationOverride,
  }) {
    final rotation = rotationOverride ??
        computeRotation(
          camera: camera,
          deviceOrientation: deviceOrientation,
        );
    if (rotation == null) return null;

    if (Platform.isAndroid && image.planes.length >= 3) {
      final nv21Bytes = _yuv420ToNv21(image);
      return InputImage.fromBytes(
        bytes: nv21Bytes,
        metadata: InputImageMetadata(
          size: Size(image.width.toDouble(), image.height.toDouble()),
          rotation: rotation,
          format: InputImageFormat.nv21,
          bytesPerRow: image.width,
        ),
      );
    }

    // Single-plane NV21 (Android) or BGRA8888 (iOS)
    final format = InputImageFormatValue.fromRawValue(image.format.raw as int);
    if (format == null) return null;

    final bytes = _concatenatePlanes(image.planes);

    return InputImage.fromBytes(
      bytes: bytes,
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: image.planes.first.bytesPerRow,
      ),
    );
  }

  /// Converts a 3-plane Android `YUV_420_888` [CameraImage] into an `NV21` byte array.
  Uint8List _yuv420ToNv21(CameraImage image) {
    final width = image.width;
    final height = image.height;
    final ySize = width * height;
    final uvSize = width * height ~/ 2;
    final nv21 = Uint8List(ySize + uvSize);

    final yPlane = image.planes[0];
    final yBuffer = yPlane.bytes;
    final yRowStride = yPlane.bytesPerRow;

    int dstIndex = 0;
    if (yRowStride == width && yBuffer.length >= ySize) {
      nv21.setRange(0, ySize, yBuffer);
      dstIndex = ySize;
    } else {
      for (int row = 0; row < height; row++) {
        final srcOffset = row * yRowStride;
        final copyLen = (srcOffset + width <= yBuffer.length)
            ? width
            : (yBuffer.length - srcOffset).clamp(0, width);
        if (copyLen > 0) {
          nv21.setRange(dstIndex, dstIndex + copyLen, yBuffer, srcOffset);
        }
        dstIndex += width;
      }
    }

    if (image.planes.length < 3) {
      return nv21;
    }

    final uPlane = image.planes[1];
    final vPlane = image.planes[2];
    final uBuffer = uPlane.bytes;
    final vBuffer = vPlane.bytes;
    final uvRowStride = uPlane.bytesPerRow;
    final uvPixelStride = uPlane.bytesPerPixel ?? 1;
    final uvHeight = height ~/ 2;
    final uvWidth = width ~/ 2;

    for (int row = 0; row < uvHeight; row++) {
      final rowOffset = row * uvRowStride;
      for (int col = 0; col < uvWidth; col++) {
        final uvIndex = rowOffset + col * uvPixelStride;
        if (uvIndex < vBuffer.length && dstIndex < nv21.length) {
          nv21[dstIndex++] = vBuffer[uvIndex];
        }
        if (uvIndex < uBuffer.length && dstIndex < nv21.length) {
          nv21[dstIndex++] = uBuffer[uvIndex];
        }
      }
    }

    return nv21;
  }

  /// Concatenates multiple image planes into a single byte array.
  Uint8List _concatenatePlanes(List<Plane> planes) {
    if (planes.length == 1) {
      return planes.first.bytes;
    }
    final allBytes = WriteBuffer();
    for (final plane in planes) {
      allBytes.putUint8List(plane.bytes);
    }
    return allBytes.done().buffer.asUint8List();
  }

  /// Checks if a face is centered and sized correctly inside a target oval boundary.
  ///
  /// Returns `null` if face alignment is optimal, or an explanatory guidance string.
  String? checkFaceAlignment({
    required Face face,
    required Size previewSize,
    required Rect targetOval,
  }) {
    final box = face.boundingBox;

    // Head orientation angles (yaw and pitch)
    final double yaw = face.headEulerAngleY ?? 0.0;
    final double pitch = face.headEulerAngleX ?? 0.0;

    if (yaw.abs() > 20.0 || pitch.abs() > 20.0) {
      return 'Tatap lurus ke arah kamera';
    }

    // Size check
    final faceArea = box.width * box.height;
    final ovalArea = targetOval.width * targetOval.height;
    final areaRatio = faceArea / ovalArea;

    if (areaRatio < 0.14) {
      return 'Dekatkan wajah ke kamera';
    }
    if (areaRatio > 1.15) {
      return 'Jauhkan sedikit wajah Anda';
    }

    // Center alignment check
    final faceCenter = box.center;
    final ovalCenter = targetOval.center;
    final dx = (faceCenter.dx - ovalCenter.dx).abs();
    final dy = (faceCenter.dy - ovalCenter.dy).abs();

    if (dx > targetOval.width * 0.35 || dy > targetOval.height * 0.35) {
      return 'Posisikan wajah tepat di tengah lingkaran';
    }

    return null; // Face is well-aligned!
  }

  Future<void> dispose() async {
    await _detector.close();
  }

  static const Map<DeviceOrientation, int> _orientations = {
    DeviceOrientation.portraitUp: 0,
    DeviceOrientation.landscapeLeft: 90,
    DeviceOrientation.portraitDown: 180,
    DeviceOrientation.landscapeRight: 270,
  };
}
