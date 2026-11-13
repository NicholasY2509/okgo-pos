import 'package:flutter/material.dart';
import '../../../../core/theme/nyenyak_tokens.dart';
import '../../../liveness/controllers/staff_face_controller.dart';
import '../../../rooms/controllers/room_list_controller.dart';
import '../../../rooms/presentation/widgets/branch_room_list_view.dart';
import '../../controllers/login_controller.dart';
import '../widgets/login_form_card.dart';

/// Responsive authentication and branch portal screen for Nyenyak Portal.
///
/// Adapts between mobile portrait/landscape and tablet split-view while
/// supporting Light and Dark theme switching. Once authenticated, renders
/// the bound branch's room directory via [BranchRoomListView].
class LoginPage extends StatelessWidget {
  const LoginPage({
    super.key,
    required this.controller,
    required this.roomListController,
    required this.themeMode,
    required this.onToggleTheme,
    this.staffFaceController,
  });

  final LoginController controller;
  final RoomListController roomListController;
  final StaffFaceController? staffFaceController;
  final ThemeMode themeMode;
  final VoidCallback onToggleTheme;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: ListenableBuilder(
          listenable: controller,
          builder: (context, _) {
            final session = controller.session;

            if (session != null) {
              return BranchRoomListView(
                session: session,
                roomListController: roomListController,
                staffFaceController: staffFaceController,
                onSignOut: controller.signOut,
                isDark: isDark,
                onToggleTheme: onToggleTheme,
              );
            }

            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: NyenyakTokens.space4,
                    vertical: NyenyakTokens.space2,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      IconButton(
                        key: const Key('theme_toggle_button'),
                        onPressed: onToggleTheme,
                        tooltip: isDark
                            ? 'Beralih ke mode terang'
                            : 'Beralih ke mode gelap',
                        icon: Icon(
                          isDark
                              ? Icons.light_mode_outlined
                              : Icons.dark_mode_outlined,
                          size: 20,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final isTablet =
                          constraints.maxWidth >= NyenyakTokens.tabletBreakpoint;

                      return Center(
                        child: SingleChildScrollView(
                          padding: EdgeInsets.symmetric(
                            horizontal: isTablet
                                ? NyenyakTokens.space8
                                : NyenyakTokens.space4,
                            vertical: NyenyakTokens.space6,
                          ),
                          child: isTablet
                              ? ConstrainedBox(
                                  constraints: const BoxConstraints(
                                    maxWidth: 840,
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.center,
                                    children: [
                                      const Expanded(
                                        flex: 5,
                                        child: Padding(
                                          padding: EdgeInsets.only(
                                            right: NyenyakTokens.space8,
                                          ),
                                          child: _BrandIdentityHeader(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            textAlign: TextAlign.left,
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        flex: 6,
                                        child: ConstrainedBox(
                                          constraints: const BoxConstraints(
                                            maxWidth:
                                                NyenyakTokens.mobileMaxWidth,
                                          ),
                                          child: LoginFormCard(
                                            controller: controller,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : ConstrainedBox(
                                  constraints: const BoxConstraints(
                                    maxWidth: NyenyakTokens.mobileMaxWidth,
                                  ),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const _BrandIdentityHeader(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.center,
                                        textAlign: TextAlign.center,
                                      ),
                                      const SizedBox(
                                        height: NyenyakTokens.space6,
                                      ),
                                      LoginFormCard(controller: controller),
                                    ],
                                  ),
                                ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _BrandIdentityHeader extends StatelessWidget {
  const _BrandIdentityHeader({
    required this.crossAxisAlignment,
    required this.textAlign,
  });

  final CrossAxisAlignment crossAxisAlignment;
  final TextAlign textAlign;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: crossAxisAlignment,
      children: [
        Image.asset(
          'assets/images/logo-long.webp',
          height: 54,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) {
            return Text(
              'Nyenyak',
              textAlign: textAlign,
              style: theme.textTheme.headlineMedium,
            );
          },
        ),
      ],
    );
  }
}
