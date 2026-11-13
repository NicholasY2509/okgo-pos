import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'nyenyak_tokens.dart';

/// Builds Light and Dark [ThemeData] matching the Nyenyak visual contract (`DESIGN.md`).
///
/// Uses [GoogleFonts.plusJakartaSans] across all typography layers to maintain
/// strict typographic consistency with the Okgo POS web application.
abstract final class NyenyakTheme {
  static ThemeData light() {
    const colorScheme = ColorScheme.light(
      primary: NyenyakTokens.primary,
      onPrimary: NyenyakTokens.primaryForeground,
      secondary: NyenyakTokens.lightMuted,
      onSecondary: NyenyakTokens.lightForeground,
      surface: NyenyakTokens.lightCard,
      onSurface: NyenyakTokens.lightForeground,
      error: NyenyakTokens.destructive,
      onError: Colors.white,
      outline: NyenyakTokens.lightBorder,
    );

    return _buildTheme(
      colorScheme: colorScheme,
      scaffoldBackgroundColor: NyenyakTokens.lightSurfaceSubtle,
      cardColor: NyenyakTokens.lightCard,
      borderColor: NyenyakTokens.lightBorder,
      mutedForeground: NyenyakTokens.lightMutedForeground,
      foreground: NyenyakTokens.lightForeground,
    );
  }

  static ThemeData dark() {
    const colorScheme = ColorScheme.dark(
      primary: NyenyakTokens.primary,
      onPrimary: NyenyakTokens.primaryForeground,
      secondary: NyenyakTokens.darkMuted,
      onSecondary: NyenyakTokens.darkForeground,
      surface: NyenyakTokens.darkCard,
      onSurface: NyenyakTokens.darkForeground,
      error: NyenyakTokens.destructive,
      onError: Colors.white,
      outline: NyenyakTokens.darkBorder,
    );

    return _buildTheme(
      colorScheme: colorScheme,
      scaffoldBackgroundColor: NyenyakTokens.darkBackground,
      cardColor: NyenyakTokens.darkCard,
      borderColor: NyenyakTokens.darkBorder,
      mutedForeground: NyenyakTokens.darkMutedForeground,
      foreground: NyenyakTokens.darkForeground,
    );
  }

  static ThemeData _buildTheme({
    required ColorScheme colorScheme,
    required Color scaffoldBackgroundColor,
    required Color cardColor,
    required Color borderColor,
    required Color mutedForeground,
    required Color foreground,
  }) {
    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
      borderSide: BorderSide(color: borderColor, width: 1.0),
    );

    final focusedInputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
      borderSide: const BorderSide(color: NyenyakTokens.primary, width: 1.5),
    );

    final errorInputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
      borderSide: const BorderSide(color: NyenyakTokens.destructive, width: 1.2),
    );

    final baseTextTheme = TextTheme(
      headlineMedium: TextStyle(
        fontSize: 28.0,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        color: foreground,
        height: 1.25,
      ),
      titleLarge: TextStyle(
        fontSize: 22.0,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
        color: foreground,
        height: 1.3,
      ),
      titleMedium: TextStyle(
        fontSize: 16.0,
        fontWeight: FontWeight.w600,
        color: foreground,
        height: 1.4,
      ),
      bodyMedium: TextStyle(
        fontSize: 14.0,
        fontWeight: FontWeight.w400,
        color: foreground,
        height: 1.45,
      ),
      bodySmall: TextStyle(
        fontSize: 12.0,
        fontWeight: FontWeight.w400,
        color: mutedForeground,
        height: 1.4,
      ),
      labelLarge: TextStyle(
        fontSize: 14.0,
        fontWeight: FontWeight.w500,
        color: foreground,
        height: 1.3,
      ),
    );

    final textTheme = GoogleFonts.plusJakartaSansTextTheme(baseTextTheme);

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: scaffoldBackgroundColor,
      fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
      cardTheme: CardThemeData(
        color: cardColor,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NyenyakTokens.radiusLg),
          side: BorderSide(color: borderColor, width: 1.0),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardColor,
        isDense: false,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: NyenyakTokens.space4,
          vertical: 14.0,
        ),
        hintStyle: TextStyle(
          color: mutedForeground,
          fontSize: 14.0,
          fontWeight: FontWeight.w400,
        ),
        errorStyle: const TextStyle(
          color: NyenyakTokens.destructive,
          fontSize: 12.5,
          fontWeight: FontWeight.w500,
        ),
        border: inputBorder,
        enabledBorder: inputBorder,
        focusedBorder: focusedInputBorder,
        errorBorder: errorInputBorder,
        focusedErrorBorder: errorInputBorder,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: NyenyakTokens.primary,
          foregroundColor: NyenyakTokens.primaryForeground,
          disabledBackgroundColor: NyenyakTokens.primary.withValues(alpha: 0.45),
          disabledForegroundColor: NyenyakTokens.primaryForeground.withValues(alpha: 0.7),
          minimumSize: const Size.fromHeight(NyenyakTokens.minTapTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: NyenyakTokens.space4,
            vertical: NyenyakTokens.space3,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
          ),
          textStyle: GoogleFonts.plusJakartaSans(
            fontSize: 14.0,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.1,
          ),
        ),
      ),
      textTheme: textTheme,
    );
  }
}

