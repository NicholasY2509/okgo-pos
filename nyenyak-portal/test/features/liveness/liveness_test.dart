import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:image/image.dart' as img;
import 'package:nyenyak_portal/features/liveness/controllers/staff_face_controller.dart';
import 'package:nyenyak_portal/features/liveness/models/face_profile.dart';
import 'package:nyenyak_portal/features/liveness/models/liveness_result.dart';
import 'package:nyenyak_portal/features/liveness/repositories/face_profile_repository.dart';
import 'package:nyenyak_portal/features/liveness/services/face_anti_spoofing_service.dart';
import 'package:nyenyak_portal/features/liveness/services/face_detector_service.dart';
import 'package:nyenyak_portal/features/liveness/services/face_embedding_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('LivenessResult Model Tests', () {
    test('creates guidance result correctly', () {
      final result = LivenessResult.guidance(
        LivenessStatus.waitingForFace,
        'Posisikan wajah di dalam lingkaran',
      );

      expect(result.status, LivenessStatus.waitingForFace);
      expect(result.isLive, false);
      expect(result.confidenceScore, 0.0);
      expect(result.message, 'Posisikan wajah di dalam lingkaran');
    });

    test('creates verified result correctly', () {
      final result = LivenessResult.verified(
        score: 0.94,
        box: const Rect.fromLTWH(50, 50, 200, 200),
      );

      expect(result.status, LivenessStatus.verified);
      expect(result.isLive, true);
      expect(result.confidenceScore, 0.94);
      expect(result.message, 'Wajah terverifikasi asli');
      expect(result.faceBoundingBox, isNotNull);
    });

    test('creates mismatch result correctly', () {
      const target = StaffFaceProfile(
        id: 'stf_1',
        name: 'Dewi Lestari',
        firstName: 'Dewi',
        lastName: 'Lestari',
        position: 'Therapist',
        hasFaceRegistered: true,
      );
      final result = LivenessResult.mismatch(
        livenessScore: 0.92,
        similarityScore: 0.41,
        targetStaff: target,
      );

      expect(result.status, LivenessStatus.faceMismatch);
      expect(result.isLive, true);
      expect(result.similarityScore, 0.41);
      expect(result.message, contains('Dewi Lestari'));
    });

    test('creates spoof detected result correctly', () {
      final result = LivenessResult.spoof(
        score: 0.12,
        box: const Rect.fromLTWH(50, 50, 200, 200),
      );

      expect(result.status, LivenessStatus.spoofDetected);
      expect(result.isLive, false);
      expect(result.confidenceScore, 0.12);
      expect(result.message, contains('Terdeteksi foto'));
    });
  });

  group('FaceDetectorService Alignment Tests', () {
    final detectorService = FaceDetectorService();
    const previewSize = Size(640, 480);
    final targetOval = Rect.fromCenter(
      center: const Offset(320, 240),
      width: 300,
      height: 350,
    );

    test('detects face tilted away from camera', () {
      final tiltedFace = Face(
        boundingBox: Rect.fromCenter(
          center: const Offset(320, 240),
          width: 180,
          height: 220,
        ),
        landmarks: {},
        contours: {},
        headEulerAngleY: 25.0,
        headEulerAngleX: 0.0,
      );

      final issue = detectorService.checkFaceAlignment(
        face: tiltedFace,
        previewSize: previewSize,
        targetOval: targetOval,
      );

      expect(issue, 'Tatap lurus ke arah kamera');
    });

    test('detects face too far away', () {
      final smallFace = Face(
        boundingBox: Rect.fromCenter(
          center: const Offset(320, 240),
          width: 60,
          height: 70,
        ),
        landmarks: {},
        contours: {},
        headEulerAngleY: 0.0,
        headEulerAngleX: 0.0,
      );

      final issue = detectorService.checkFaceAlignment(
        face: smallFace,
        previewSize: previewSize,
        targetOval: targetOval,
      );

      expect(issue, 'Dekatkan wajah ke kamera');
    });

    test('detects face off center', () {
      final offCenterFace = Face(
        boundingBox: Rect.fromCenter(
          center: const Offset(100, 100),
          width: 180,
          height: 220,
        ),
        landmarks: {},
        contours: {},
        headEulerAngleY: 0.0,
        headEulerAngleX: 0.0,
      );

      final issue = detectorService.checkFaceAlignment(
        face: offCenterFace,
        previewSize: previewSize,
        targetOval: targetOval,
      );

      expect(issue, 'Posisikan wajah tepat di tengah lingkaran');
    });

    test('accepts well-aligned face', () {
      final goodFace = Face(
        boundingBox: Rect.fromCenter(
          center: const Offset(320, 240),
          width: 180,
          height: 220,
        ),
        landmarks: {},
        contours: {},
        headEulerAngleY: 2.0,
        headEulerAngleX: -3.0,
      );

      final issue = detectorService.checkFaceAlignment(
        face: goodFace,
        previewSize: previewSize,
        targetOval: targetOval,
      );

      expect(issue, isNull);
    });
  });

  group('FaceAntiSpoofingService Image & Crop Tests', () {
    final antiSpoofService = FaceAntiSpoofingService();

    test('cropFace extracts valid region with expansion scale', () {
      final testCanvas = img.Image(width: 400, height: 400);
      img.fill(testCanvas, color: img.ColorRgb8(120, 150, 180));

      final cropped = antiSpoofService.cropFace(
        fullImage: testCanvas,
        boundingBox: const Rect.fromLTWH(100, 100, 100, 100),
        expansionScale: 1.2,
      );

      expect(cropped, isNotNull);
      expect(cropped!.width, 120);
      expect(cropped.height, 120);
    });

    test('evaluates heuristic texture variance in fallback mode', () async {
      final sample = img.Image(width: 80, height: 80);
      for (int y = 0; y < 80; y++) {
        for (int x = 0; x < 80; x++) {
          sample.setPixelRgb(
            x,
            y,
            (x * 3) % 256,
            (y * 3) % 256,
            ((x + y) * 2) % 256,
          );
        }
      }

      final score = await antiSpoofService.evaluateFaceCrop(sample);
      expect(score, greaterThanOrEqualTo(0.0));
      expect(score, lessThanOrEqualTo(1.0));
    });
  });

  group('FaceEmbeddingService Registration & Verification Tests', () {
    final embeddingService = FaceEmbeddingService();

    img.Image createSyntheticFaceImage({required int patternSeed}) {
      final image = img.Image(width: 112, height: 112);
      for (int y = 0; y < 112; y++) {
        for (int x = 0; x < 112; x++) {
          final r = ((x * patternSeed + y * 2) % 256);
          final g = ((y * patternSeed + x * 3) % 256);
          final b = (((x + y) * patternSeed) % 256);
          image.setPixelRgb(x, y, r, g, b);
        }
      }
      return image;
    }

    test('extractEmbedding produces unit-length 192D vector', () async {
      final faceImg = createSyntheticFaceImage(patternSeed: 5);
      final vec = await embeddingService.extractEmbedding(faceImg);

      expect(vec.length, 192);
      final normSq = vec.fold<double>(0.0, (acc, v) => acc + v * v);
      expect(math.sqrt(normSq), closeTo(1.0, 1e-5));
    });

    test('verifyOneToOne matches identical/similar face and rejects different face', () async {
      final facePersonA1 = createSyntheticFaceImage(patternSeed: 7);
      final facePersonA2 = createSyntheticFaceImage(patternSeed: 7);
      // Create a completely inverted/orthogonal pattern for Person B
      final facePersonB = img.Image(width: 112, height: 112);
      for (int y = 0; y < 112; y++) {
        for (int x = 0; x < 112; x++) {
          final lum = x < 56 ? 240 : 15;
          facePersonB.setPixelRgb(x, y, lum, lum, lum);
        }
      }

      final embA1 = await embeddingService.extractEmbedding(facePersonA1);
      final embA2 = await embeddingService.extractEmbedding(facePersonA2);
      final embB = await embeddingService.extractEmbedding(facePersonB);

      final centroidA = embeddingService.computeCentroid([embA1, embA2]);
      final profileA = StaffFaceProfile(
        id: 'stf_dewi',
        name: 'Dewi Lestari',
        firstName: 'Dewi',
        lastName: 'Lestari',
        position: 'Senior Therapist',
        hasFaceRegistered: true,
        faceEmbedding: centroidA,
      );

      // Same person verification
      final matchSame = embeddingService.verifyOneToOne(
        liveEmbedding: embA1,
        targetStaff: profileA,
      );
      expect(matchSame.isMatched, true);
      expect(matchSame.similarity, closeTo(1.0, 1e-4));
      expect(matchSame.matchedStaff?.id, 'stf_dewi');

      // Different person verification
      final matchDiff = embeddingService.verifyOneToOne(
        liveEmbedding: embB,
        targetStaff: profileA,
      );
      expect(matchDiff.isMatched, false);
      expect(matchDiff.similarity, lessThan(0.75));
      expect(matchDiff.matchedStaff, isNull);
    });

    test('identifyOneToMany identifies the right staff member from candidate list', () {
      final emb1 = embeddingService.normalizeVector(
        List<double>.generate(192, (i) => i == 0 ? 1.0 : 0.0),
      );
      final emb2 = embeddingService.normalizeVector(
        List<double>.generate(192, (i) => i == 1 ? 1.0 : 0.0),
      );

      final candidates = <StaffFaceProfile>[
        StaffFaceProfile(
          id: 'stf_1',
          name: 'Dewi Lestari',
          firstName: 'Dewi',
          lastName: 'Lestari',
          position: 'Therapist',
          hasFaceRegistered: true,
          faceEmbedding: emb1,
        ),
        StaffFaceProfile(
          id: 'stf_2',
          name: 'Rina Wati',
          firstName: 'Rina',
          lastName: 'Wati',
          position: 'Therapist',
          hasFaceRegistered: true,
          faceEmbedding: emb2,
        ),
      ];

      final queryForRina = embeddingService.normalizeVector(
        List<double>.generate(192, (i) => i == 1 ? 0.95 : (i == 2 ? 0.1 : 0.0)),
      );

      final result = embeddingService.identifyOneToMany(
        liveEmbedding: queryForRina,
        candidates: candidates,
      );

      expect(result.isMatched, true);
      expect(result.matchedStaff?.id, 'stf_2');
      expect(result.matchedStaff?.name, 'Rina Wati');
      expect(result.similarity, greaterThan(0.95));
    });
  });

  group('PortalFaceProfileRepository & StaffFaceController Sync Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues(<String, Object>{});
    });

    test('loads branch staff face profiles, registers face embedding, and caches locally', () async {
      final sampleEmbedding = List<double>.generate(
        192,
        (i) => i == 0 ? 1.0 : 0.0,
      );

      final mockClient = MockClient((http.Request request) async {
        if (request.method == 'GET' &&
            request.url.path == '/api/portal/staff/faces') {
          return http.Response(
            jsonEncode(<String, dynamic>{
              'success': true,
              'data': <Map<String, dynamic>>[
                <String, dynamic>{
                  'id': 'stf_1',
                  'name': 'Dewi Lestari',
                  'firstName': 'Dewi',
                  'lastName': 'Lestari',
                  'staffIdNumber': 'STF-001',
                  'position': 'Therapist',
                  'hasFaceRegistered': false,
                  'faceEmbedding': null,
                  'faceRegisteredAt': null,
                },
              ],
            }),
            200,
          );
        }

        if (request.method == 'POST' &&
            request.url.path == '/api/portal/staff/faces') {
          final body = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response(
            jsonEncode(<String, dynamic>{
              'success': true,
              'data': <String, dynamic>{
                'id': body['staffId'],
                'name': 'Dewi Lestari',
                'firstName': 'Dewi',
                'lastName': 'Lestari',
                'staffIdNumber': 'STF-001',
                'position': 'Therapist',
                'hasFaceRegistered': true,
                'faceEmbedding': body['embedding'],
                'faceRegisteredAt': '2026-11-01T12:00:00.000Z',
              },
            }),
            200,
          );
        }

        return http.Response('Not Found', 404);
      });

      final repo = PortalFaceProfileRepository(
        httpClient: mockClient,
        baseUrl: 'http://localhost:3000',
      );
      final controller = StaffFaceController(repository: repo);

      await controller.loadProfiles('br_juanda');
      expect(controller.totalCount, 1);
      expect(controller.registeredCount, 0);
      expect(controller.unregisteredCount, 1);

      // Register face for stf_1
      final updated = await controller.registerStaffFace(
        branchId: 'br_juanda',
        staffId: 'stf_1',
        embedding: sampleEmbedding,
      );

      expect(updated, isNotNull);
      expect(updated!.hasFaceRegistered, true);
      expect(controller.registeredCount, 1);
      expect(controller.unregisteredCount, 0);

      // Verify 1:1 against registered staff
      final verification = controller.verifyStaffFace(
        targetStaff: updated,
        liveEmbedding: sampleEmbedding,
      );
      expect(verification.isMatched, true);
      expect(verification.similarityPercent, 100);

      // Verify local cache was populated
      final cached = await repo.loadCachedProfiles('br_juanda');
      expect(cached.length, 1);
      expect(cached.first.hasFaceRegistered, true);
    });
  });
}
