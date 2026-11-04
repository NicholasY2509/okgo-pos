# ADR-0008: On-Device Passive Face Anti-Spoofing via TFLite & ML Kit

- **Status:** Accepted
- **Date:** 2026-10-29
- **Deciders:** Okgo POS Engineering Team

## Context

Nyenyak Portal mobile and tablet devices require face liveness verification to authenticate individuals or log presence. The solution must run offline, eliminate third-party per-request billing, and avoid active challenge prompts (blinking, smiling, turning the head) that create high friction and slow user throughput at kiosks or portal stations.

## Decision

We adopt an on-device hybrid passive liveness detection pipeline in `nyenyak-portal`:

1. **Face Localization & Alignment**: Use `google_mlkit_face_detection` (configured with `FaceDetectorMode.fast`) to identify face bounding boxes in real-time camera frames.
2. **Anti-Spoofing Inference**: Crop the face region of interest (ROI) and execute a quantized MiniVision Silent-Face-Anti-Spoofing neural network using `tflite_flutter` with native hardware acceleration (CoreML on iOS, NNAPI/GPU on Android).
3. **Threshold Gate**: The model outputs a liveness probability distribution. When the real-face score exceeds `0.85` across consecutive frames, liveness passes automatically without requiring active user cooperation.
4. **Modularity**: Implement the feature under `nyenyak-portal/lib/features/liveness/` following the existing clean architecture pattern (`models`, `services`, `controllers`, `presentation`).

## Consequences

### Easier

- Zero recurring API or SaaS costs; operates completely offline.
- Sub-500 ms verification time without user fatigue or active challenge friction.
- Decoupled architecture: the liveness verification widget can be embedded across attendance, kiosk, and authentication flows.

### Harder

- Adds model asset overhead (~3 MB) to the application bundle.
- Requires native camera and hardware permissions in `AndroidManifest.xml` and `Info.plist`.
- Native C++ TFLite binaries must be bundled and linked across target mobile architectures.

## Alternatives considered

### Active Challenge Verification (ML Kit Eye-Blink & Head-Turn)
- Rejected because requiring users to blink, smile, or rotate their head creates noticeable friction and delay at kiosk/portal terminals.

### Cloud Anti-Spoofing APIs (AWS Rekognition / Verihubs)
- Rejected due to per-call transaction costs, latency, and reliance on persistent high-speed internet connectivity.

