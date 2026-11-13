# Face Anti-Spoofing & Face Recognition Model Assets

This directory contains on-device neural network weights for passive face liveness detection and face embedding extraction.

## 1. Passive Liveness Model: `anti_spoofing.tflite`
- **Architecture:** MiniVision Silent-Face-Anti-Spoofing (Fourier frequency domain + multi-scale texture CNN).
- **Input Tensor:** `[1, 80, 80, 3]` (RGB float32 normalized 0.0–1.0).
- **Output Tensor:** `[1, 3]` logits `[Spoof2D, Real, Spoof3D/Mask]`.
- **Runtime:** TensorFlow Lite via `tflite_flutter` with XNNPack / GPU / CoreML delegates.

## 2. Face Recognition Embedding Model: `mobilefacenet.tflite`
- **Architecture:** MobileFaceNet (ArcFace-trained lightweight face feature extractor).
- **Input Tensor:** `[1, 112, 112, 3]` (RGB float32 normalized `(pixel - 127.5) / 128.0` in range `[-1.0, 1.0]`).
- **Output Tensor:** `[1, 192]` L2-normalized embedding vector.
- **Matching Metric:** Cosine Similarity ($\text{sim}(\mathbf{u}, \mathbf{v}) = \mathbf{u} \cdot \mathbf{v}$) with default threshold $\ge 0.75$.

If `.tflite` weight files are not mounted during unit tests or simulated environments, `FaceAntiSpoofingService` and `FaceEmbeddingService` gracefully operate in deterministic spatial-feature fallback mode.


