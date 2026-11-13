import 'package:flutter/material.dart';
import '../../../../core/theme/nyenyak_tokens.dart';
import '../../models/face_profile.dart';
import '../../models/liveness_result.dart';

/// Minimalist, elegant camera overlay for face verification and registration,
/// designed to match Nyenyak's visual contract (`DESIGN.md`).
class FaceLivenessOverlay extends StatefulWidget {
  const FaceLivenessOverlay({
    super.key,
    required this.result,
    this.mode = FaceRecognitionMode.livenessOnly,
    this.targetStaff,
    this.onReset,
  });

  final LivenessResult result;
  final FaceRecognitionMode mode;
  final StaffFaceProfile? targetStaff;
  final VoidCallback? onReset;

  @override
  State<FaceLivenessOverlay> createState() => _FaceLivenessOverlayState();
}

class _FaceLivenessOverlayState extends State<FaceLivenessOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.96, end: 1.03).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Color _resolveBorderColor() {
    switch (widget.result.status) {
      case LivenessStatus.verified:
        return NyenyakTokens.success;
      case LivenessStatus.spoofDetected:
      case LivenessStatus.faceMismatch:
        return NyenyakTokens.destructive;
      case LivenessStatus.analyzing:
        return NyenyakTokens.primary;
      case LivenessStatus.error:
        return NyenyakTokens.destructive;
      case LivenessStatus.faceOffCenter:
      case LivenessStatus.faceTooClose:
      case LivenessStatus.faceTooFar:
      case LivenessStatus.multipleFacesDetected:
        return NyenyakTokens.primaryHover;
      case LivenessStatus.initializing:
      case LivenessStatus.waitingForFace:
        return Colors.white.withValues(alpha: 0.85);
    }
  }

  String _resolveHeaderKicker() {
    return switch (widget.mode) {
      FaceRecognitionMode.register => 'REGISTRASI BIOMETRIK',
      FaceRecognitionMode.verifyOneToOne => 'VERIFIKASI TERAPIS',
      FaceRecognitionMode.identifyOneToMany => 'IDENTIFIKASI STAF',
      FaceRecognitionMode.livenessOnly => 'VERIFIKASI WAJAH',
    };
  }

  String _resolveHeaderTitle() {
    return switch (widget.mode) {
      FaceRecognitionMode.register =>
        widget.targetStaff?.name ?? 'Perekaman Data Wajah',
      FaceRecognitionMode.verifyOneToOne =>
        widget.targetStaff?.name ?? 'Pencocokan Wajah Terapis',
      FaceRecognitionMode.identifyOneToMany => 'Pindai Wajah Staf',
      FaceRecognitionMode.livenessOnly => 'Verifikasi Biometrik',
    };
  }

  @override
  Widget build(BuildContext context) {
    final borderColor = _resolveBorderColor();
    final isAnalyzing = widget.result.status == LivenessStatus.analyzing;
    final canRetry = (widget.result.status == LivenessStatus.spoofDetected ||
            widget.result.status == LivenessStatus.faceMismatch) &&
        widget.onReset != null;

    return Stack(
      fit: StackFit.expand,
      children: [
        // Camera Viewfinder & Cutout Mask
        CustomPaint(
          painter: _ViewfinderCutoutPainter(
            borderColor: borderColor,
            borderWidth: isAnalyzing ? 1.8 : 1.2,
            pulseScale: isAnalyzing ? _pulseAnimation.value : 1.0,
          ),
        ),

        // Header Guidance (Minimalist Floating Pill)
        Positioned(
          top: MediaQuery.paddingOf(context).top + NyenyakTokens.space5,
          left: NyenyakTokens.space6,
          right: NyenyakTokens.space10 + 20.0,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: NyenyakTokens.space5,
                vertical: NyenyakTokens.space3,
              ),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B).withValues(alpha: 0.88),
                borderRadius: BorderRadius.circular(NyenyakTokens.radiusLg),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.12),
                  width: 1.0,
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _resolveHeaderKicker(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: NyenyakTokens.primary,
                      fontWeight: FontWeight.w600,
                      fontSize: 10.0,
                      letterSpacing: 1.4,
                    ),
                  ),
                  const SizedBox(height: 3.0),
                  Text(
                    _resolveHeaderTitle(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                      fontSize: 16.0,
                      letterSpacing: -0.2,
                    ),
                  ),
                  if (widget.mode == FaceRecognitionMode.register) ...[
                    const SizedBox(height: 3.0),
                    Text(
                      'Sampel ${widget.result.capturedSamplesCount} dari ${widget.result.requiredSamplesCount}',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontWeight: FontWeight.w400,
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),

        // Bottom Status Feedback Card
        Positioned(
          bottom: MediaQuery.paddingOf(context).bottom + NyenyakTokens.space6,
          left: NyenyakTokens.space6,
          right: NyenyakTokens.space6,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    padding: const EdgeInsets.symmetric(
                      horizontal: NyenyakTokens.space5,
                      vertical: NyenyakTokens.space3 + 2,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B).withValues(alpha: 0.90),
                      borderRadius: BorderRadius.circular(
                        NyenyakTokens.radiusLg,
                      ),
                      border: Border.all(
                        color: borderColor.withValues(
                          alpha: isAnalyzing ? 0.75 : 0.35,
                        ),
                        width: 1.0,
                      ),
                    ),
                    child: Row(
                      children: [
                        _buildStatusIcon(),
                        const SizedBox(width: NyenyakTokens.space3),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                widget.result.message,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w500,
                                  fontSize: 13.5,
                                ),
                              ),
                              if (widget.result.status ==
                                  LivenessStatus.analyzing) ...[
                                const SizedBox(height: NyenyakTokens.space2),
                                const ClipRRect(
                                  borderRadius: BorderRadius.all(
                                    Radius.circular(2.0),
                                  ),
                                  child: LinearProgressIndicator(
                                    minHeight: 2.0,
                                    color: NyenyakTokens.primary,
                                    backgroundColor: Colors.white24,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  if (canRetry) ...[
                    const SizedBox(height: NyenyakTokens.space3),
                    OutlinedButton.icon(
                      onPressed: widget.onReset,
                      icon: const Icon(
                        Icons.refresh_rounded,
                        size: 16,
                        color: Colors.white,
                      ),
                      label: const Text('Ulangi Verifikasi'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 38.0),
                        backgroundColor: const Color(0xFF18181B).withValues(
                          alpha: 0.85,
                        ),
                        foregroundColor: Colors.white,
                        side: BorderSide(
                          color: Colors.white.withValues(alpha: 0.25),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: NyenyakTokens.space5,
                          vertical: NyenyakTokens.space2,
                        ),
                        textStyle: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w500,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                            NyenyakTokens.radiusMd,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusIcon() {
    switch (widget.result.status) {
      case LivenessStatus.verified:
        return const Icon(
          Icons.check_circle_rounded,
          color: NyenyakTokens.success,
          size: 22,
        );
      case LivenessStatus.spoofDetected:
      case LivenessStatus.faceMismatch:
        return const Icon(
          Icons.error_outline_rounded,
          color: NyenyakTokens.destructive,
          size: 22,
        );
      case LivenessStatus.analyzing:
        return const SizedBox(
          width: 18,
          height: 18,
          child: CircularProgressIndicator(
            strokeWidth: 2.0,
            valueColor: AlwaysStoppedAnimation<Color>(NyenyakTokens.primary),
          ),
        );
      case LivenessStatus.waitingForFace:
      case LivenessStatus.initializing:
      case LivenessStatus.faceOffCenter:
      case LivenessStatus.faceTooClose:
      case LivenessStatus.faceTooFar:
      case LivenessStatus.multipleFacesDetected:
      case LivenessStatus.error:
        return const Icon(
          Icons.face_retouching_natural,
          color: Colors.white70,
          size: 22,
        );
    }
  }
}

/// Custom painter rendering a dark mask with a rounded-corner viewfinder
/// and elegant corner reticles matching the Nyenyak design identity.
class _ViewfinderCutoutPainter extends CustomPainter {
  const _ViewfinderCutoutPainter({
    required this.borderColor,
    required this.borderWidth,
    required this.pulseScale,
  });

  final Color borderColor;
  final double borderWidth;
  final double pulseScale;

  @override
  void paint(Canvas canvas, Size size) {
    final isLandscape = size.width > size.height;
    final baseWidth = isLandscape
        ? (size.height * 0.44).clamp(240.0, 360.0)
        : size.width * 0.72;
    final baseHeight = isLandscape
        ? (size.height * 0.54).clamp(300.0, 440.0)
        : size.height * 0.46;

    final boxWidth = baseWidth * pulseScale;
    final boxHeight = baseHeight * pulseScale;
    final centerOffset = Offset(size.width / 2, size.height * 0.44);

    final boxRect = Rect.fromCenter(
      center: centerOffset,
      width: boxWidth,
      height: boxHeight,
    );

    const cornerRadius = Radius.circular(28.0);
    final rrect = RRect.fromRectAndRadius(boxRect, cornerRadius);

    // Dark mask with transparent aperture
    final backgroundPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final cutoutPath = Path()..addRRect(rrect);

    final maskPath = Path.combine(
      PathOperation.difference,
      backgroundPath,
      cutoutPath,
    );

    final maskPaint = Paint()
      ..color = const Color(0xFF09090B).withValues(alpha: 0.65)
      ..style = PaintingStyle.fill;

    canvas.drawPath(maskPath, maskPaint);

    // Subtle Viewfinder Outline
    final borderPaint = Paint()
      ..color = borderColor.withValues(alpha: 0.45)
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    canvas.drawRRect(rrect, borderPaint);

    // 4 Elegant Corner Reticle Brackets
    final reticlePaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth + 1.0
      ..strokeCap = StrokeCap.round;

    const cornerLength = 24.0;
    const r = 28.0;

    // Top-Left corner
    final tlPath = Path()
      ..moveTo(boxRect.left, boxRect.top + r + cornerLength)
      ..lineTo(boxRect.left, boxRect.top + r)
      ..arcToPoint(
        Offset(boxRect.left + r, boxRect.top),
        radius: const Radius.circular(r),
      )
      ..lineTo(boxRect.left + r + cornerLength, boxRect.top);
    canvas.drawPath(tlPath, reticlePaint);

    // Top-Right corner
    final trPath = Path()
      ..moveTo(boxRect.right - r - cornerLength, boxRect.top)
      ..lineTo(boxRect.right - r, boxRect.top)
      ..arcToPoint(
        Offset(boxRect.right, boxRect.top + r),
        radius: const Radius.circular(r),
      )
      ..lineTo(boxRect.right, boxRect.top + r + cornerLength);
    canvas.drawPath(trPath, reticlePaint);

    // Bottom-Left corner
    final blPath = Path()
      ..moveTo(boxRect.left, boxRect.bottom - r - cornerLength)
      ..lineTo(boxRect.left, boxRect.bottom - r)
      ..arcToPoint(
        Offset(boxRect.left + r, boxRect.bottom),
        radius: const Radius.circular(r),
        clockwise: false,
      )
      ..lineTo(boxRect.left + r + cornerLength, boxRect.bottom);
    canvas.drawPath(blPath, reticlePaint);

    // Bottom-Right corner
    final brPath = Path()
      ..moveTo(boxRect.right - r - cornerLength, boxRect.bottom)
      ..lineTo(boxRect.right - r, boxRect.bottom)
      ..arcToPoint(
        Offset(boxRect.right, boxRect.bottom - r),
        radius: const Radius.circular(r),
        clockwise: false,
      )
      ..lineTo(boxRect.right, boxRect.bottom - r - cornerLength);
    canvas.drawPath(brPath, reticlePaint);
  }

  @override
  bool shouldRepaint(covariant _ViewfinderCutoutPainter oldDelegate) {
    return oldDelegate.borderColor != borderColor ||
        oldDelegate.borderWidth != borderWidth ||
        oldDelegate.pulseScale != pulseScale;
  }
}
