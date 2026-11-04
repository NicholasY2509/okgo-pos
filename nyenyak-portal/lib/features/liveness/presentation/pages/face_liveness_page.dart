import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/nyenyak_tokens.dart';
import '../../controllers/face_liveness_controller.dart';
import '../../models/face_profile.dart';
import '../../models/liveness_result.dart';
import '../widgets/face_liveness_overlay.dart';

/// Full-screen face liveness, registration, and verification view with real-time camera feed.
class FaceLivenessPage extends StatefulWidget {
  const FaceLivenessPage({
    super.key,
    this.mode = FaceRecognitionMode.livenessOnly,
    this.targetStaff,
    this.candidateProfiles = const <StaffFaceProfile>[],
    this.onVerified,
    this.onCancel,
    this.controller,
  });

  /// Active recognition mode (liveness only, register, 1:1 verify, or 1:N identify).
  final FaceRecognitionMode mode;

  /// Target staff profile when registering or verifying 1:1.
  final StaffFaceProfile? targetStaff;

  /// Candidate staff profiles when identifying 1:N.
  final List<StaffFaceProfile> candidateProfiles;

  /// Callback fired when liveness verification / registration succeeds.
  final ValueChanged<LivenessResult>? onVerified;

  /// Callback when user dismisses the verification page.
  final VoidCallback? onCancel;

  /// Optional injected controller for testing.
  final FaceLivenessController? controller;

  @override
  State<FaceLivenessPage> createState() => _FaceLivenessPageState();
}

class _FaceLivenessPageState extends State<FaceLivenessPage> {
  late final FaceLivenessController _controller;
  bool _hasTriggeredCallback = false;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ??
        FaceLivenessController(
          mode: widget.mode,
          targetStaff: widget.targetStaff,
          candidateProfiles: widget.candidateProfiles,
        );
    _controller.addListener(_handleControllerState);
    if (widget.controller == null) {
      _controller.initialize();
    }
  }

  void _handleControllerState() {
    if (!mounted) return;
    setState(() {});

    if (_controller.result.status == LivenessStatus.verified &&
        !_hasTriggeredCallback) {
      _hasTriggeredCallback = true;
      Future.delayed(const Duration(milliseconds: 650), () {
        if (mounted) {
          widget.onVerified?.call(_controller.result);
        }
      });
    }
  }

  @override
  void dispose() {
    _controller.removeListener(_handleControllerState);
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cameraController = _controller.cameraController;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera Preview
          if (cameraController != null && cameraController.value.isInitialized)
            Center(
              child: CameraPreview(cameraController),
            )
          else
            _buildLoadingState(),

          // Guide Cutout & Feedback Overlay
          FaceLivenessOverlay(
            result: _controller.result,
            mode: _controller.mode,
            targetStaff: _controller.targetStaff,
            onReset: () {
              _hasTriggeredCallback = false;
              _controller.reset();
            },
          ),

          // Close button
          Positioned(
            top: MediaQuery.paddingOf(context).top + NyenyakTokens.space3,
            right: NyenyakTokens.space3,
            child: IconButton(
              icon: const Icon(Icons.close_rounded, color: Colors.white, size: 22),
              style: IconButton.styleFrom(
                backgroundColor: const Color(0xFF18181B).withValues(alpha: 0.85),
                shape: const CircleBorder(),
              ),
              onPressed: () {
                widget.onCancel?.call();
                Navigator.of(context).maybePop();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Container(
      color: NyenyakTokens.darkBackground,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(NyenyakTokens.primary),
            ),
            const SizedBox(height: NyenyakTokens.space4),
            Text(
              _controller.result.message,
              style: const TextStyle(
                color: NyenyakTokens.darkForeground,
                fontSize: 14.0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
