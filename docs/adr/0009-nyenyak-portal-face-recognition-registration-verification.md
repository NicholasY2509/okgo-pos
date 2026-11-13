# ADR-0009: On-Device Face Embedding Registration & Verification with Server-Synced Profiles

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** Okgo POS Engineering Team

## Context

Following the implementation of passive face anti-spoofing in [ADR-0008](0008-nyenyak-portal-on-device-passive-face-liveness.md), Nyenyak Portal tablets require biometric face registration and verification (both 1:1 staff verification for assigned room sessions and 1:N staff identification) for branch staff and therapists. Storing or transmitting raw biometric photographs to third-party cloud APIs introduces latency, recurring transaction costs, and privacy liabilities. At the same time, a staff member registered on one tablet must be immediately verifiable on any room tablet within the branch.

## Decision

We adopt a hybrid on-device face embedding extraction and server-synchronized vector storage architecture:

1. **On-Device Feature Extraction (`FaceEmbeddingService`)**: After a face crop passes alignment (`google_mlkit_face_detection`) and passive liveness (`FaceAntiSpoofingService`), `nyenyak-portal` extracts an L2-normalized 192-dimensional float32 face embedding vector from the aligned $112 \times 112$ RGB crop (normalized to $[-1, 1]$) using a MobileFaceNet TensorFlow Lite model (`assets/models/mobilefacenet.tflite`) accelerated via XNNPack (Android) or GPU (iOS). When running in test or simulator environments without the `.tflite` weight file, the service falls back to a deterministic multi-scale spatial luminance & gradient descriptor normalized to a 192D unit vector.
2. **Multi-Sample Centroid Registration**: During face registration, the pipeline captures 3 consecutive live-verified frames, extracts their 192D embeddings, computes their centroid vector, and re-normalizes it to unit length ($\|\mathbf{v}\|_2 = 1.0$) before saving.
3. **Cosine Similarity Verification (1:1 & 1:N)**: Similarity between a live embedding $\mathbf{u}$ and a stored embedding $\mathbf{v}$ is computed via dot product / cosine similarity ($\text{sim}(\mathbf{u}, \mathbf{v}) = \mathbf{u} \cdot \mathbf{v}$). A match is confirmed when $\text{sim} \ge 0.75$.
4. **Prisma Schema & REST Sync + Local Cache**:
   - Extend `Staff` in `prisma/schema/staff.prisma` with `faceEmbedding Json?` (storing `number[]`) and `faceRegisteredAt DateTime?`.
   - Expose `GET /api/portal/staff/faces?branchId=<id>` and `POST /api/portal/staff/faces` following the 5-layer DDD module pattern (`modules/staff/`).
   - Cache branch staff face embeddings locally in `SharedPreferences` on `nyenyak-portal` so verification runs in $< 50\text{ ms}$ on-device even during temporary Wi-Fi drops.

## Consequences

### Easier

- Sub-50 ms 1:1 and 1:N matching directly on the room tablet with zero cloud API fees.
- Privacy-preserving: only compact 192-float mathematical vectors (`~1.5 KB` JSON) are persisted in MySQL and cached locally, never raw biometric camera feeds.
- Seamless multi-tablet synchronization across all rooms in a branch via `/api/portal/staff/faces`.

### Harder

- Updating the embedding model architecture in the future requires re-enrolling staff embeddings if vector dimensions or latent spaces change.
- Requires consistent face alignment (`checkFaceAlignment` inside the guide oval) prior to embedding extraction to prevent pose-induced false rejections.

## Alternatives considered

### Cloud Face Recognition APIs (AWS Rekognition / Azure Face)
- Rejected due to per-call cost, network round-trip latency at room doors, and external storage of biometric imagery.

### Device-Only Local Storage (No Backend Sync)
- Rejected because branches operate multiple room tablets; staff would otherwise have to register their face separately on every single room tablet.

