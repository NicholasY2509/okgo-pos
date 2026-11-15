# ADR-0015: Cloud InsightFace Embedding Extraction via face-hrms-api

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** Okgo POS Engineering Team
- **Supersedes:** Embedding extraction portion of [ADR-0009](0009-nyenyak-portal-face-recognition-registration-verification.md)

## Context

In production use of `nyenyak-portal`, on-device face recognition using `mobilefacenet.tflite` (192-dimensional embeddings without 5-point landmark affine alignment) exhibited cross-day false rejections: staff faces registered on one day frequently failed to match the next day under slightly different ambient lighting, camera distance, or head tilt. Additionally, devices falling back to the heuristic spatial descriptor mode could not produce stable embeddings across sessions.

We already maintain `face-hrms-api`, a Python FastAPI service running InsightFace (`buffalo_l`), which performs 5-point facial landmark affine alignment and extracts L2-normalized 512-dimensional ArcFace embeddings.

## Decision

1. **Cloud Embedding Extraction (`face-hrms-api`)**:
   - Deploy `face-hrms-api` via Docker with `POST /face/extract` returning L2-normalized 512D InsightFace embeddings.
   - `nyenyak-pos` proxies extraction requests through `POST /api/portal/staff/faces/extract` using `FaceApiClient` (`FACE_API_URL`, `FACE_API_TOKEN`) so the API token is never exposed to mobile clients.
2. **Hybrid On-Device Detection + Cloud Recognition**:
   - `nyenyak-portal` keeps `google_mlkit_face_detection` on-device for real-time alignment guidance, bounding-box cropping, and passive liveness checks before sending compact JPEG face crops to `nyenyak-pos`.
   - `Staff.faceEmbedding` in Prisma (already validated up to 512 dimensions in `registerStaffFaceSchema`) stores the 512D InsightFace embedding, and `nyenyak-portal` continues 1:1 and 1:N cosine matching against synced/cached branch profiles with an InsightFace-calibrated threshold (`0.45`).

## Consequences

### Easier
- Consistent cross-day recognition accuracy thanks to 5-point landmark alignment and 512D ArcFace embeddings.
- Centralized ML model updates in `face-hrms-api` without rebuilding or redistributing `.tflite` weights in `nyenyak-portal`.

### Harder
- Face registration and live embedding extraction require network connectivity to `nyenyak-pos` and `face-hrms-api`.
- Existing 192D staff face embeddings must be re-enrolled once to match the 512D InsightFace vector space.
