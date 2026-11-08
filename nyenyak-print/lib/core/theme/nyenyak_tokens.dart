import 'package:flutter/material.dart';

/// Semantic design tokens synchronized with root `DESIGN.md`.
///
/// Color values correspond to the OKLCH palette defined in `app/globals.css`.
abstract final class NyenyakTokens {
  // Brand & Accent Colors
  static const Color primary = Color(0xFFF59E0B); // oklch(0.795 0.184 86.047)
  static const Color primaryHover = Color(0xFFD97706);
  static const Color primaryForeground = Color(0xFF18181B);

  // Light Mode Surfaces & Ink
  static const Color lightBackground = Color(0xFFFFFFFF);
  static const Color lightSurfaceSubtle = Color(0xFFFAFAFA);
  static const Color lightForeground = Color(0xFF09090B);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightMuted = Color(0xFFF4F4F5);
  static const Color lightMutedForeground = Color(0xFF71717A);
  static const Color lightBorder = Color(0xFFE4E4E7);

  // Dark Mode Surfaces & Ink
  static const Color darkBackground = Color(0xFF09090B);
  static const Color darkSurfaceSubtle = Color(0xFF121215);
  static const Color darkForeground = Color(0xFFFAFAFA);
  static const Color darkCard = Color(0xFF18181B);
  static const Color darkMuted = Color(0xFF27272A);
  static const Color darkMutedForeground = Color(0xFFA1A1AA);
  static const Color darkBorder = Color(0xFF27272A);

  // Semantic Status Colors
  static const Color destructive = Color(0xFFEF4444);
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);

  // 4px Grid Spacing Scale
  static const double space1 = 4.0;
  static const double space2 = 8.0;
  static const double space3 = 12.0;
  static const double space4 = 16.0;
  static const double space5 = 20.0;
  static const double space6 = 24.0;
  static const double space8 = 32.0;
  static const double space10 = 40.0;

  // Border Radius Scale (Base: 10px)
  static const double radiusSm = 6.0;
  static const double radiusMd = 8.0;
  static const double radiusLg = 10.0;
  static const double radiusXl = 14.0;

  // Minimum accessible tap target
  static const double minTapTarget = 48.0;

  // Device Form Factor & Layout Breakpoints
  static const double phoneMaxShortestSide = 600.0;
  static const double tabletBreakpoint = 720.0;
  static const double tabletLandscapeBreakpoint = 960.0;
  static const double tabletWorkspaceMaxWidth = 1240.0;
}
