import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/theme/nyenyak_tokens.dart';
import '../../../auth/models/login_credentials.dart';
import '../../../liveness/controllers/staff_face_controller.dart';
import '../../../liveness/models/face_profile.dart';
import '../../../liveness/models/liveness_result.dart';
import '../../../liveness/presentation/pages/face_liveness_page.dart';
import '../../../liveness/presentation/widgets/staff_face_management_drawer.dart';
import '../../controllers/room_list_controller.dart';
import '../../models/portal_room.dart';

/// Full-viewport tablet & mobile workspace displaying the Nyenyak branch header,
/// room selection grid, and the selected room's live active/upcoming schedule
/// with slide-over drawers for completed session history and staff face biometrics.
class BranchRoomListView extends StatefulWidget {
  const BranchRoomListView({
    super.key,
    required this.session,
    required this.roomListController,
    required this.onSignOut,
    this.staffFaceController,
    this.isDark = false,
    this.onToggleTheme,
  });

  final AuthSession session;
  final RoomListController roomListController;
  final StaffFaceController? staffFaceController;
  final VoidCallback onSignOut;
  final bool isDark;
  final VoidCallback? onToggleTheme;

  @override
  State<BranchRoomListView> createState() => _BranchRoomListViewState();
}

class _BranchRoomListViewState extends State<BranchRoomListView> {
  StaffFaceController? _fallbackFaceController;

  StaffFaceController get _faceController =>
      widget.staffFaceController ??
      (_fallbackFaceController ??= StaffFaceController());

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        widget.roomListController.loadRooms(widget.session.branchId);
        _faceController.loadProfiles(widget.session.branchId);
      }
    });
  }

  @override
  void reassemble() {
    super.reassemble();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _faceController.loadProfiles(widget.session.branchId);
      }
    });
  }

  @override
  void didUpdateWidget(covariant BranchRoomListView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.session.branchId != widget.session.branchId) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          widget.roomListController.loadRooms(
            widget.session.branchId,
            forceRefresh: true,
          );
          _faceController.loadProfiles(
            widget.session.branchId,
            forceRefresh: true,
          );
        }
      });
    }
  }

  @override
  void dispose() {
    if (widget.staffFaceController == null) {
      _fallbackFaceController?.dispose();
    }
    super.dispose();
  }

  void _handleSignOut() {
    widget.roomListController.clear();
    _faceController.clear();
    widget.onSignOut();
  }

  void _openStaffFaceDrawer(BuildContext context) {
    final faceCtrl = _faceController;
    faceCtrl.loadProfiles(widget.session.branchId);
    showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Tutup biometrik wajah staf',
      barrierColor: Colors.black.withValues(alpha: 0.35),
      transitionDuration: const Duration(milliseconds: 220),
      pageBuilder: (dialogContext, animation, secondaryAnimation) {
        return Align(
          alignment: Alignment.centerRight,
          child: StaffFaceManagementDrawer(
            branchId: widget.session.branchId,
            branchName: widget.session.branchName,
            controller: faceCtrl,
            onClose: () => Navigator.of(dialogContext).pop(),
          ),
        );
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        final curved = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
        );
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(1.0, 0.0),
            end: Offset.zero,
          ).animate(curved),
          child: child,
        );
      },
    );
  }

  void _openHistoryDrawer(BuildContext context, PortalRoom room) {
    showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Tutup riwayat sesi',
      barrierColor: Colors.black.withValues(alpha: 0.35),
      transitionDuration: const Duration(milliseconds: 220),
      pageBuilder: (dialogContext, animation, secondaryAnimation) {
        return Align(
          alignment: Alignment.centerRight,
          child: _RoomHistoryDrawer(
            room: room,
            roomListController: widget.roomListController,
            onClose: () => Navigator.of(dialogContext).pop(),
          ),
        );
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        final curved = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
        );
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(1.0, 0.0),
            end: Offset.zero,
          ).animate(curved),
          child: child,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final session = widget.session;
    final dividerColor = theme.colorScheme.outline;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Signature Nyenyak warm-gold top accent line
        Container(
          height: 2.0,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                NyenyakTokens.primary,
                NyenyakTokens.primary.withValues(alpha: 0.25),
              ],
            ),
          ),
        ),
        Container(
          key: const Key('authenticated_session_card'),
          padding: const EdgeInsets.symmetric(
            horizontal: NyenyakTokens.space6,
            vertical: NyenyakTokens.space4,
          ),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            border: Border(
              bottom: BorderSide(color: dividerColor, width: 1.0),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Image.asset(
                'assets/images/logo-only.png',
                height: 28.0,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return const SizedBox.shrink();
                },
              ),
              const SizedBox(width: NyenyakTokens.space4),
              Container(
                width: 1.0,
                height: 28.0,
                color: dividerColor,
              ),
              const SizedBox(width: NyenyakTokens.space4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      session.branchName,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontSize: 18.0,
                        fontWeight: FontWeight.w400,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 2.0),
                    Text(
                      '${session.displayName} · ${session.role} · ${session.email}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontSize: 12.0,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              OutlinedButton.icon(
                key: const Key('open_staff_face_drawer_button'),
                onPressed: () => _openStaffFaceDrawer(context),
                icon: const Icon(
                  Icons.center_focus_weak_rounded,
                  size: 15.0,
                  color: NyenyakTokens.primaryHover,
                ),
                label: const Text('Biometrik Staf'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(0, 40.0),
                  padding: const EdgeInsets.symmetric(
                    horizontal: NyenyakTokens.space4,
                    vertical: NyenyakTokens.space2,
                  ),
                  side: BorderSide(color: dividerColor),
                  foregroundColor: theme.colorScheme.onSurface,
                  textStyle: const TextStyle(
                    fontSize: 13.0,
                    fontWeight: FontWeight.w500,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
                  ),
                ),
              ),
              const SizedBox(width: NyenyakTokens.space2),
              if (widget.onToggleTheme != null) ...[
                IconButton(
                  key: const Key('theme_toggle_button'),
                  onPressed: widget.onToggleTheme,
                  tooltip: widget.isDark
                      ? 'Beralih ke mode terang'
                      : 'Beralih ke mode gelap',
                  icon: Icon(
                    widget.isDark
                        ? Icons.light_mode_outlined
                        : Icons.dark_mode_outlined,
                    size: 20,
                  ),
                ),
                const SizedBox(width: NyenyakTokens.space2),
              ],
              OutlinedButton(
                key: const Key('logout_button'),
                onPressed: _handleSignOut,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(0, 40.0),
                  padding: const EdgeInsets.symmetric(
                    horizontal: NyenyakTokens.space4,
                    vertical: NyenyakTokens.space2,
                  ),
                  side: BorderSide(color: dividerColor),
                  foregroundColor: theme.colorScheme.onSurface,
                  textStyle: const TextStyle(
                    fontSize: 13.0,
                    fontWeight: FontWeight.w500,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
                  ),
                ),
                child: const Text('Keluar'),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListenableBuilder(
            listenable: widget.roomListController,
            builder: (context, _) {
              final selectedRoom = widget.roomListController.selectedRoom;
              if (selectedRoom != null) {
                return PopScope(
                  canPop: false,
                  onPopInvokedWithResult: (didPop, _) {
                    if (!didPop) {
                      widget.roomListController.unselectRoom();
                    }
                  },
                  child: _SelectedRoomSessionsView(
                    room: selectedRoom,
                    roomListController: widget.roomListController,
                    staffFaceController: _faceController,
                    onOpenHistory: () =>
                        _openHistoryDrawer(context, selectedRoom),
                    onOpenStaffFaceDrawer: () => _openStaffFaceDrawer(context),
                  ),
                );
              }

              final isLoading = widget.roomListController.isLoading;
              final errorMessage = widget.roomListController.errorMessage;
              final rooms = widget.roomListController.rooms;

              return SingleChildScrollView(
                padding: const EdgeInsets.all(NyenyakTokens.space6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'KONFIGURASI STASIUN RUANGAN',
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1.8,
                                color: NyenyakTokens.primaryHover,
                              ),
                            ),
                            const SizedBox(height: NyenyakTokens.space1),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.baseline,
                              textBaseline: TextBaseline.alphabetic,
                              children: [
                                Text(
                                  'Pilih Ruangan Perangkat',
                                  style: theme.textTheme.titleLarge?.copyWith(
                                    fontSize: 24.0,
                                    fontWeight: FontWeight.w300,
                                    letterSpacing: -0.4,
                                  ),
                                ),
                                if (!isLoading && errorMessage == null) ...[
                                  const SizedBox(width: NyenyakTokens.space3),
                                  Text(
                                    '${rooms.length}',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      fontSize: 13.5,
                                      fontFeatures: const [
                                        FontFeature.tabularFigures(),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                        TextButton(
                          key: const Key('refresh_rooms_button'),
                          onPressed: isLoading
                              ? null
                              : () => widget.roomListController.loadRooms(
                                    session.branchId,
                                    forceRefresh: true,
                                  ),
                          style: TextButton.styleFrom(
                            minimumSize: const Size(44.0, 36.0),
                            padding: const EdgeInsets.symmetric(
                              horizontal: NyenyakTokens.space2,
                            ),
                            foregroundColor: theme.textTheme.bodySmall?.color,
                            textStyle: const TextStyle(
                              fontSize: 13.0,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          child: const Text('Muat Ulang'),
                        ),
                      ],
                    ),
                    const SizedBox(height: NyenyakTokens.space5),
                    if (isLoading)
                      Card(
                        key: const Key('rooms_loading_indicator'),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: NyenyakTokens.space6,
                            vertical: NyenyakTokens.space8,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.0,
                                  color: NyenyakTokens.primary,
                                ),
                              ),
                              const SizedBox(width: NyenyakTokens.space3),
                              Text(
                                'Memuat daftar ruangan cabang...',
                                style: theme.textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      )
                    else if (errorMessage != null)
                      Card(
                        key: const Key('rooms_error_banner'),
                        child: Padding(
                          padding: const EdgeInsets.all(NyenyakTokens.space5),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                errorMessage,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: NyenyakTokens.destructive,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: NyenyakTokens.space3),
                              OutlinedButton(
                                key: const Key('retry_rooms_button'),
                                onPressed: () =>
                                    widget.roomListController.loadRooms(
                                      session.branchId,
                                      forceRefresh: true,
                                    ),
                                style: OutlinedButton.styleFrom(
                                  minimumSize: const Size(0, 40.0),
                                  side: BorderSide(color: dividerColor),
                                ),
                                child: const Text('Coba Lagi'),
                              ),
                            ],
                          ),
                        ),
                      )
                    else if (rooms.isEmpty)
                      Card(
                        key: const Key('rooms_empty_state'),
                        child: Padding(
                          padding: const EdgeInsets.all(NyenyakTokens.space6),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Belum ada ruangan terdaftar',
                                style: theme.textTheme.titleMedium,
                              ),
                              const SizedBox(height: NyenyakTokens.space1),
                              Text(
                                'Cabang ${session.branchName} belum memiliki data ruangan. Tambahkan ruangan melalui panel Admin POS.',
                                style: theme.textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final maxWidth = constraints.maxWidth;
                          final columns = maxWidth >= 960
                              ? 4
                              : maxWidth >= 600
                                  ? 3
                                  : maxWidth >= 340
                                      ? 2
                                      : 1;
                          const gap = NyenyakTokens.space4;
                          final cardWidth =
                              (maxWidth - (gap * (columns - 1))) / columns;

                          return Wrap(
                            spacing: gap,
                            runSpacing: gap,
                            children: rooms.map((room) {
                              return SizedBox(
                                width: cardWidth,
                                child: _RoomCard(
                                  room: room,
                                  onSelect: () =>
                                      widget.roomListController.selectRoom(room),
                                ),
                              );
                            }).toList(),
                          );
                        },
                      ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _RoomCard extends StatelessWidget {
  const _RoomCard({
    required this.room,
    required this.onSelect,
  });

  final PortalRoom room;
  final VoidCallback onSelect;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final mutedColor = theme.textTheme.bodySmall?.color;
    final borderColor = room.isVip
        ? NyenyakTokens.primary.withValues(alpha: 0.45)
        : theme.colorScheme.outline;
    final cardSurface = room.isVip
        ? Color.alphaBlend(
            NyenyakTokens.primary.withValues(alpha: isDark ? 0.06 : 0.03),
            theme.colorScheme.surface,
          )
        : theme.colorScheme.surface;

    return Card(
      key: Key('room_card_${room.id}'),
      color: cardSurface,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(NyenyakTokens.radiusLg),
        side: BorderSide(color: borderColor, width: 1.0),
      ),
      child: InkWell(
        onTap: onSelect,
        borderRadius: BorderRadius.circular(NyenyakTokens.radiusLg),
        child: Padding(
          padding: const EdgeInsets.all(NyenyakTokens.space5),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    room.isVip ? 'SUITE PRIVAT' : 'RUANG TERAPI',
                    style: TextStyle(
                      fontSize: 10.0,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.6,
                      color: room.isVip
                          ? NyenyakTokens.primaryHover
                          : mutedColor,
                    ),
                  ),
                  if (room.isVip)
                    _VipPill()
                  else if (!room.isActive)
                    Text(
                      'Nonaktif',
                      style: TextStyle(
                        fontSize: 11.0,
                        fontWeight: FontWeight.w500,
                        color: mutedColor,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: NyenyakTokens.space2),
              Text(
                room.name,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontSize: 19.0,
                  fontWeight: FontWeight.w400,
                  letterSpacing: -0.3,
                  color: room.isActive
                      ? theme.colorScheme.onSurface
                      : mutedColor,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: NyenyakTokens.space4),
              Container(
                width: 24.0,
                height: 1.0,
                color: room.isVip
                    ? NyenyakTokens.primary.withValues(alpha: 0.5)
                    : theme.colorScheme.outline,
              ),
              const SizedBox(height: NyenyakTokens.space3),
              Text(
                room.capacity != null
                    ? 'Kapasitas ${room.capacity} orang'
                    : 'Kapasitas standar',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontSize: 12.5,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SelectedRoomSessionsView extends StatelessWidget {
  const _SelectedRoomSessionsView({
    required this.room,
    required this.roomListController,
    required this.staffFaceController,
    required this.onOpenHistory,
    required this.onOpenStaffFaceDrawer,
  });

  final PortalRoom room;
  final RoomListController roomListController;
  final StaffFaceController staffFaceController;
  final VoidCallback onOpenHistory;
  final VoidCallback onOpenStaffFaceDrawer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dividerColor = theme.colorScheme.outline;

    return LayoutBuilder(
      key: Key('selected_room_view_${room.id}'),
      builder: (context, constraints) {
        final isWideLayout = constraints.maxWidth >= 600.0;
        final toastSessions = roomListController.activeToastSessions;

        final Widget mainContent = isWideLayout
            ? Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: constraints.maxWidth >= 960 ? 320.0 : 280.0,
                    padding: const EdgeInsets.all(NyenyakTokens.space6),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      border: Border(
                        right: BorderSide(color: dividerColor, width: 1.0),
                      ),
                    ),
                    child: _RoomStationSidebar(
                      room: room,
                      roomListController: roomListController,
                      onOpenHistory: onOpenHistory,
                    ),
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(NyenyakTokens.space6),
                      child: _RoomScheduleSection(
                        room: room,
                        roomListController: roomListController,
                        staffFaceController: staffFaceController,
                        isWideLayout: true,
                        onOpenHistory: onOpenHistory,
                        onOpenStaffFaceDrawer: onOpenStaffFaceDrawer,
                      ),
                    ),
                  ),
                ],
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(NyenyakTokens.space5),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _CompactRoomStationHeader(
                      room: room,
                      roomListController: roomListController,
                      onOpenHistory: onOpenHistory,
                    ),
                    const SizedBox(height: NyenyakTokens.space5),
                    _RoomScheduleSection(
                      room: room,
                      roomListController: roomListController,
                      staffFaceController: staffFaceController,
                      isWideLayout: false,
                      onOpenHistory: onOpenHistory,
                      onOpenStaffFaceDrawer: onOpenStaffFaceDrawer,
                    ),
                  ],
                ),
              );

        return Stack(
          children: [
            Positioned.fill(child: mainContent),
            Positioned(
              top: NyenyakTokens.space4,
              right: NyenyakTokens.space4,
              left: isWideLayout ? null : NyenyakTokens.space4,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 240),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                transitionBuilder: (child, animation) {
                  return FadeTransition(
                    opacity: animation,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.0, -0.2),
                        end: Offset.zero,
                      ).animate(animation),
                      child: child,
                    ),
                  );
                },
                child: toastSessions.isEmpty
                    ? const SizedBox.shrink()
                    : ConstrainedBox(
                        key: ValueKey<int>(
                          roomListController.toastNotificationVersion,
                        ),
                        constraints: const BoxConstraints(maxWidth: 420.0),
                        child: _NewServiceToastBanner(
                          roomName: room.name,
                          sessions: toastSessions,
                          onDismiss: roomListController.dismissNewSessionToast,
                        ),
                      ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _RoomStationSidebar extends StatelessWidget {
  const _RoomStationSidebar({
    required this.room,
    required this.roomListController,
    required this.onOpenHistory,
  });

  final PortalRoom room;
  final RoomListController roomListController;
  final VoidCallback onOpenHistory;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dividerColor = theme.colorScheme.outline;
    final isLoading = roomListController.isLoadingSessions;
    final sessions = roomListController.roomSessions;
    final isConnected = roomListController.isSocketConnected;

    final inProgressCount = sessions.where((s) => s.isInProgress).length;
    final scheduledCount = sessions.where((s) => s.isScheduled).length;
    final completedCount = sessions.where((s) => s.isCompleted).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'STASIUN RUANGAN',
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.8,
            color: NyenyakTokens.primaryHover,
          ),
        ),
        const SizedBox(height: NyenyakTokens.space2),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                room.name,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontSize: 28.0,
                  fontWeight: FontWeight.w300,
                  letterSpacing: -0.5,
                ),
              ),
            ),
            if (room.isVip) ...[
              const SizedBox(width: NyenyakTokens.space2),
              _VipPill(),
            ],
          ],
        ),
        const SizedBox(height: NyenyakTokens.space3),
        Container(
          width: 32.0,
          height: 1.5,
          alignment: Alignment.centerLeft,
          color: NyenyakTokens.primary,
        ),
        const SizedBox(height: NyenyakTokens.space3),
        _LiveStatusRow(room: room, isConnected: isConnected),
        const SizedBox(height: NyenyakTokens.space6),
        Container(
          padding: const EdgeInsets.symmetric(
            vertical: NyenyakTokens.space4,
          ),
          decoration: BoxDecoration(
            border: Border.symmetric(
              horizontal: BorderSide(color: dividerColor, width: 1.0),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: _RoomMetricItem(
                  label: 'Berlangsung',
                  value: '$inProgressCount',
                  highlight: inProgressCount > 0,
                ),
              ),
              Container(
                width: 1.0,
                height: 40.0,
                color: dividerColor,
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(
                    left: NyenyakTokens.space4,
                  ),
                  child: _RoomMetricItem(
                    label: 'Terjadwal',
                    value: '$scheduledCount',
                  ),
                ),
              ),
            ],
          ),
        ),
        const Spacer(),
        OutlinedButton(
          key: const Key('room_history_button'),
          onPressed: onOpenHistory,
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(44.0),
            side: BorderSide(color: dividerColor),
            foregroundColor: theme.colorScheme.onSurface,
            textStyle: const TextStyle(
              fontSize: 13.0,
              fontWeight: FontWeight.w500,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Riwayat Sesi'),
              Text(
                '$completedCount',
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: theme.textTheme.bodySmall?.color,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: NyenyakTokens.space3),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                key: const Key('refresh_room_sessions_button'),
                onPressed: isLoading
                    ? null
                    : () => roomListController.loadSelectedRoomSessions(),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(0, 44.0),
                  side: BorderSide(color: dividerColor),
                  foregroundColor: theme.colorScheme.onSurface,
                  textStyle: const TextStyle(
                    fontSize: 13.0,
                    fontWeight: FontWeight.w500,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
                  ),
                ),
                child: const Text('Muat Ulang'),
              ),
            ),
            const SizedBox(width: NyenyakTokens.space3),
            Expanded(
              child: OutlinedButton(
                key: const Key('change_room_button'),
                onPressed: roomListController.unselectRoom,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(0, 44.0),
                  side: BorderSide(color: dividerColor),
                  foregroundColor: theme.colorScheme.onSurface,
                  textStyle: const TextStyle(
                    fontSize: 13.0,
                    fontWeight: FontWeight.w500,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
                  ),
                ),
                child: const Text('Ganti Ruangan'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _CompactRoomStationHeader extends StatelessWidget {
  const _CompactRoomStationHeader({
    required this.room,
    required this.roomListController,
    required this.onOpenHistory,
  });

  final PortalRoom room;
  final RoomListController roomListController;
  final VoidCallback onOpenHistory;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dividerColor = theme.colorScheme.outline;
    final isLoading = roomListController.isLoadingSessions;
    final isConnected = roomListController.isSocketConnected;
    final completedCount = roomListController.roomSessions
        .where((s) => s.isCompleted)
        .length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'STASIUN RUANGAN',
          style: TextStyle(
            fontSize: 10.0,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.6,
            color: NyenyakTokens.primaryHover,
          ),
        ),
        const SizedBox(height: NyenyakTokens.space1),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          room.name,
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontSize: 22.0,
                            fontWeight: FontWeight.w300,
                            letterSpacing: -0.3,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (room.isVip) ...[
                        const SizedBox(width: NyenyakTokens.space2),
                        _VipPill(),
                      ],
                    ],
                  ),
                  const SizedBox(height: NyenyakTokens.space1),
                  _LiveStatusRow(room: room, isConnected: isConnected),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: NyenyakTokens.space3),
        Wrap(
          spacing: NyenyakTokens.space2,
          runSpacing: NyenyakTokens.space2,
          children: [
            OutlinedButton(
              key: const Key('room_history_button'),
              onPressed: onOpenHistory,
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(0, 38.0),
                padding: const EdgeInsets.symmetric(
                  horizontal: NyenyakTokens.space3,
                ),
                side: BorderSide(color: dividerColor),
                foregroundColor: theme.colorScheme.onSurface,
                textStyle: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w500,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
                ),
              ),
              child: Text('Riwayat Sesi ($completedCount)'),
            ),
            OutlinedButton(
              key: const Key('refresh_room_sessions_button'),
              onPressed: isLoading
                  ? null
                  : () => roomListController.loadSelectedRoomSessions(),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(0, 38.0),
                padding: const EdgeInsets.symmetric(
                  horizontal: NyenyakTokens.space3,
                ),
                side: BorderSide(color: dividerColor),
                foregroundColor: theme.colorScheme.onSurface,
                textStyle: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w500,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
                ),
              ),
              child: const Text('Muat Ulang'),
            ),
            OutlinedButton(
              key: const Key('change_room_button'),
              onPressed: roomListController.unselectRoom,
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(0, 38.0),
                padding: const EdgeInsets.symmetric(
                  horizontal: NyenyakTokens.space3,
                ),
                side: BorderSide(color: dividerColor),
                foregroundColor: theme.colorScheme.onSurface,
                textStyle: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w500,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
                ),
              ),
              child: const Text('Ganti Ruangan'),
            ),
          ],
        ),
      ],
    );
  }
}

class _VipPill extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 6.0,
        vertical: 2.0,
      ),
      decoration: BoxDecoration(
        color: NyenyakTokens.primary.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(
          NyenyakTokens.radiusSm,
        ),
      ),
      child: const Text(
        'VIP',
        style: TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.6,
          color: NyenyakTokens.primaryHover,
        ),
      ),
    );
  }
}

class _LiveStatusRow extends StatelessWidget {
  const _LiveStatusRow({
    required this.room,
    required this.isConnected,
  });

  final PortalRoom room;
  final bool isConnected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Container(
          width: 6.0,
          height: 6.0,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isConnected
                ? NyenyakTokens.success
                : theme.colorScheme.outline,
          ),
        ),
        const SizedBox(width: 6.0),
        Text(
          isConnected ? 'Sinkronisasi langsung' : 'Menghubungkan',
          style: theme.textTheme.bodySmall?.copyWith(
            fontSize: 12.5,
          ),
        ),
        if (room.capacity != null)
          Text(
            ' · Kapasitas ${room.capacity} orang',
            style: theme.textTheme.bodySmall?.copyWith(
              fontSize: 12.5,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
      ],
    );
  }
}

class _RoomMetricItem extends StatelessWidget {
  const _RoomMetricItem({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: theme.textTheme.titleLarge?.copyWith(
            fontSize: 28.0,
            fontWeight: FontWeight.w300,
            color: highlight
                ? NyenyakTokens.primaryHover
                : theme.colorScheme.onSurface,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
        const SizedBox(height: 2.0),
        Text(
          label.toUpperCase(),
          style: theme.textTheme.bodySmall?.copyWith(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }
}

class _RoomScheduleSection extends StatefulWidget {
  const _RoomScheduleSection({
    required this.room,
    required this.roomListController,
    required this.staffFaceController,
    required this.isWideLayout,
    required this.onOpenHistory,
    required this.onOpenStaffFaceDrawer,
  });

  final PortalRoom room;
  final RoomListController roomListController;
  final StaffFaceController staffFaceController;
  final bool isWideLayout;
  final VoidCallback onOpenHistory;
  final VoidCallback onOpenStaffFaceDrawer;

  @override
  State<_RoomScheduleSection> createState() => _RoomScheduleSectionState();
}

class _RoomScheduleSectionState extends State<_RoomScheduleSection> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(
      text: widget.roomListController.sessionSearchQuery,
    );
  }

  @override
  void didUpdateWidget(covariant _RoomScheduleSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    final controllerQuery = widget.roomListController.sessionSearchQuery;
    if (_searchController.text != controllerQuery) {
      _searchController.value = TextEditingValue(
        text: controllerQuery,
        selection: TextSelection.collapsed(offset: controllerQuery.length),
      );
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _clearSearch() {
    _searchController.clear();
    widget.roomListController.setSessionSearchQuery('');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dividerColor = theme.colorScheme.outline;
    final room = widget.room;
    final roomListController = widget.roomListController;
    final isLoading = roomListController.isLoadingSessions;
    final errorMessage = roomListController.sessionsErrorMessage;
    final totalActiveAndUpcoming = roomListController.activeAndUpcomingSessions;
    final filteredSessions =
        roomListController.filteredActiveAndUpcomingSessions;
    final hasSearchQuery =
        roomListController.sessionSearchQuery.trim().isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'ANTREAN & LAYANAN AKTIF',
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.8,
            color: NyenyakTokens.primaryHover,
          ),
        ),
        const SizedBox(height: NyenyakTokens.space1),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              'Jadwal Sesi Hari Ini',
              style: theme.textTheme.titleLarge?.copyWith(
                fontSize: 22.0,
                fontWeight: FontWeight.w300,
                letterSpacing: -0.3,
              ),
            ),
            if (!isLoading && errorMessage == null) ...[
              const SizedBox(width: NyenyakTokens.space2),
              Text(
                hasSearchQuery
                    ? '${filteredSessions.length}/${totalActiveAndUpcoming.length}'
                    : '${totalActiveAndUpcoming.length}',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontSize: 13.5,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: NyenyakTokens.space4),
        TextField(
          key: const Key('room_sessions_search_input'),
          controller: _searchController,
          onChanged: roomListController.setSessionSearchQuery,
          textInputAction: TextInputAction.search,
          style: theme.textTheme.bodyMedium?.copyWith(fontSize: 14.0),
          decoration: InputDecoration(
            hintText: 'Cari layanan, tamu, atau terapis...',
            prefixIcon: Icon(
              Icons.search,
              size: 18,
              color: theme.textTheme.bodySmall?.color,
            ),
            suffixIcon: hasSearchQuery
                ? IconButton(
                    key: const Key('clear_room_sessions_search_button'),
                    onPressed: _clearSearch,
                    tooltip: 'Hapus pencarian',
                    icon: const Icon(Icons.close, size: 18),
                  )
                : null,
          ),
        ),
        const SizedBox(height: NyenyakTokens.space4),
        if (isLoading)
          Card(
            key: const Key('room_sessions_loading_indicator'),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: NyenyakTokens.space6,
                vertical: NyenyakTokens.space8,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.0,
                      color: NyenyakTokens.primary,
                    ),
                  ),
                  const SizedBox(width: NyenyakTokens.space3),
                  Text(
                    'Memuat jadwal sesi ruangan...',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          )
        else if (errorMessage != null)
          Card(
            key: const Key('room_sessions_error_banner'),
            child: Padding(
              padding: const EdgeInsets.all(NyenyakTokens.space5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    errorMessage,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: NyenyakTokens.destructive,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: NyenyakTokens.space3),
                  OutlinedButton(
                    key: const Key('retry_room_sessions_button'),
                    onPressed: () =>
                        roomListController.loadSelectedRoomSessions(),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, 44.0),
                      side: BorderSide(color: dividerColor),
                    ),
                    child: const Text('Coba Lagi'),
                  ),
                ],
              ),
            ),
          )
        else if (totalActiveAndUpcoming.isEmpty)
          Card(
            key: const Key('room_sessions_empty_state'),
            child: Padding(
              padding: const EdgeInsets.all(NyenyakTokens.space6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Belum ada sesi aktif atau terjadwal',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: NyenyakTokens.space1),
                  Text(
                    'Sesi layanan yang sedang berlangsung atau terjadwal untuk ${room.name} akan otomatis tampil di sini secara real-time.',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          )
        else if (filteredSessions.isEmpty)
          Card(
            key: const Key('room_sessions_search_empty_state'),
            child: Padding(
              padding: const EdgeInsets.all(NyenyakTokens.space6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tidak ada sesi yang cocok',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: NyenyakTokens.space1),
                  Text(
                    'Tidak ditemukan sesi layanan, tamu, atau terapis dengan kata kunci "${roomListController.sessionSearchQuery.trim()}".',
                    style: theme.textTheme.bodySmall,
                  ),
                  const SizedBox(height: NyenyakTokens.space3),
                  OutlinedButton(
                    key: const Key('reset_room_sessions_search_button'),
                    onPressed: _clearSearch,
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, 40.0),
                      side: BorderSide(color: dividerColor),
                      foregroundColor: theme.colorScheme.onSurface,
                    ),
                    child: const Text('Reset Pencarian'),
                  ),
                ],
              ),
            ),
          )
        else
          LayoutBuilder(
            key: const Key('room_sessions_grid'),
            builder: (context, constraints) {
              final maxWidth = constraints.maxWidth;
              final columns = maxWidth >= 860
                  ? 3
                  : maxWidth >= 420
                      ? 2
                      : 1;
              const gap = NyenyakTokens.space4;
              final cardWidth =
                  (maxWidth - (gap * (columns - 1))) / columns;

              return ListenableBuilder(
                listenable: widget.staffFaceController,
                builder: (context, _) {
                  return Wrap(
                    spacing: gap,
                    runSpacing: gap,
                    children: filteredSessions.map((session) {
                      final verification = widget.staffFaceController
                          .getSessionVerification(session.id);
                      final isNewSession =
                          roomListController.isNewSession(session.id);
                      return SizedBox(
                        width: cardWidth,
                        child: _RoomSessionCard(
                          session: session,
                          isTabletLayout: widget.isWideLayout,
                          isNewSession: isNewSession,
                          newHighlightDuration:
                              roomListController.newSessionHighlightDuration,
                          verificationRecord: verification,
                          staffFaceController: widget.staffFaceController,
                          roomListController: widget.roomListController,
                          onOpenStaffFaceDrawer: widget.onOpenStaffFaceDrawer,
                        ),
                      );
                    }).toList(),
                  );
                },
              );
            },
          ),
      ],
    );
  }
}

class _NewServiceToastBanner extends StatelessWidget {
  const _NewServiceToastBanner({
    required this.roomName,
    required this.sessions,
    required this.onDismiss,
  });

  final String roomName;
  final List<RoomServiceSession> sessions;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final first = sessions.first;
    final title = sessions.length == 1
        ? 'Layanan Baru Ditugaskan'
        : '${sessions.length} Layanan Baru Ditugaskan';
    final detailLine =
        '${first.itemName} • ${first.customerName} (${first.staffName ?? "Belum ditentukan"})';

    final surfaceColor = Color.alphaBlend(
      NyenyakTokens.primary.withValues(alpha: isDark ? 0.14 : 0.08),
      theme.colorScheme.surface,
    );

    return Material(
      key: const Key('new_service_toast_banner'),
      color: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(NyenyakTokens.radiusLg),
          border: Border.all(
            color: NyenyakTokens.primary.withValues(alpha: 0.75),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.45 : 0.12),
              blurRadius: 18.0,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: NyenyakTokens.space4,
          vertical: NyenyakTokens.space3,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 34.0,
              height: 34.0,
              decoration: BoxDecoration(
                color: NyenyakTokens.primary.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
              ),
              alignment: Alignment.center,
              child: const Icon(
                Icons.notifications_active_outlined,
                size: 18.0,
                color: NyenyakTokens.primaryHover,
              ),
            ),
            const SizedBox(width: NyenyakTokens.space3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2.0),
                  Text(
                    detailLine,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontSize: 12.5,
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.85),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2.0),
                  Text(
                    'Ruangan $roomName · ${first.formattedTimeRange}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontSize: 11.5,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              key: const Key('dismiss_new_service_toast_button'),
              onPressed: onDismiss,
              visualDensity: VisualDensity.compact,
              tooltip: 'Tutup notifikasi',
              icon: Icon(
                Icons.close,
                size: 16.0,
                color: theme.textTheme.bodySmall?.color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RoomSessionCard extends StatefulWidget {
  const _RoomSessionCard({
    required this.session,
    required this.isTabletLayout,
    this.isNewSession = false,
    this.newHighlightDuration = const Duration(seconds: 10),
    this.verificationRecord,
    this.staffFaceController,
    this.roomListController,
    this.onOpenStaffFaceDrawer,
  });

  final RoomServiceSession session;
  final bool isTabletLayout;
  final bool isNewSession;
  final Duration newHighlightDuration;
  final VerifiedSessionRecord? verificationRecord;
  final StaffFaceController? staffFaceController;
  final RoomListController? roomListController;
  final VoidCallback? onOpenStaffFaceDrawer;

  @override
  State<_RoomSessionCard> createState() => _RoomSessionCardState();
}

class _RoomSessionCardState extends State<_RoomSessionCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _fadeController;
  Timer? _sessionTimer;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: widget.newHighlightDuration,
    );
    if (widget.isNewSession) {
      _fadeController.forward(from: 0.0);
    }
    _syncSessionTimer();
  }

  void _syncSessionTimer() {
    final shouldRun = widget.session.isInProgress;
    if (shouldRun && _sessionTimer == null) {
      _sessionTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) setState(() {});
      });
    } else if (!shouldRun && _sessionTimer != null) {
      _sessionTimer?.cancel();
      _sessionTimer = null;
    }
  }

  @override
  void didUpdateWidget(covariant _RoomSessionCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.newHighlightDuration != widget.newHighlightDuration) {
      _fadeController.duration = widget.newHighlightDuration;
    }
    if (widget.isNewSession && !oldWidget.isNewSession) {
      _fadeController.forward(from: 0.0);
    } else if (!widget.isNewSession && oldWidget.isNewSession) {
      _fadeController.stop();
      _fadeController.value = 1.0;
    }
    _syncSessionTimer();
  }

  @override
  void dispose() {
    _sessionTimer?.cancel();
    _sessionTimer = null;
    _fadeController.dispose();
    super.dispose();
  }

  static String _formatElapsedTimer(DateTime start) {
    final diff = DateTime.now().difference(start);
    final nonNegative = diff.isNegative ? Duration.zero : diff;
    final hours = nonNegative.inHours.toString().padLeft(2, '0');
    final minutes =
        nonNegative.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds =
        nonNegative.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  void _showSessionDetailDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return _SessionDetailDialog(
          session: widget.session,
          verificationRecord: widget.verificationRecord,
          staffFaceController: widget.staffFaceController,
          roomListController: widget.roomListController,
          onOpenStaffFaceDrawer: widget.onOpenStaffFaceDrawer,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final dividerColor = theme.colorScheme.outline;
    final session = widget.session;
    final isTabletLayout = widget.isTabletLayout;
    final isInProgress = session.isInProgress;
    final isCompleted = session.isCompleted;
    final mutedColor = theme.textTheme.bodySmall?.color;

    final baseBorderColor = isInProgress
        ? NyenyakTokens.primary.withValues(alpha: 0.45)
        : theme.colorScheme.outline.withValues(alpha: isDark ? 0.6 : 0.8);

    final baseCardColor = isInProgress
        ? Color.alphaBlend(
            NyenyakTokens.primary.withValues(alpha: isDark ? 0.07 : 0.03),
            theme.colorScheme.surface,
          )
        : theme.colorScheme.surface;

    final highlightCardColor = Color.alphaBlend(
      NyenyakTokens.primary.withValues(alpha: isDark ? 0.22 : 0.12),
      theme.colorScheme.surface,
    );

    final statusColor = isInProgress
        ? NyenyakTokens.primaryHover
        : isCompleted
            ? mutedColor
            : theme.colorScheme.onSurface;

    return AnimatedBuilder(
      animation: _fadeController,
      builder: (context, _) {
        final double highlightIntensity = widget.isNewSession
            ? (1.0 - Curves.easeOutCubic.transform(_fadeController.value))
                .clamp(0.0, 1.0)
            : 0.0;

        final effectiveBorderColor = Color.lerp(
          baseBorderColor,
          NyenyakTokens.primary,
          highlightIntensity,
        )!;
        final effectiveBorderWidth = 1.0 + (1.0 * highlightIntensity);
        final effectiveCardColor = Color.lerp(
          baseCardColor,
          highlightCardColor,
          highlightIntensity,
        )!;

        return DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(NyenyakTokens.radiusLg),
            boxShadow: highlightIntensity > 0.01
                ? [
                    BoxShadow(
                      color: NyenyakTokens.primary.withValues(
                        alpha: (isDark ? 0.28 : 0.18) * highlightIntensity,
                      ),
                      blurRadius: 18.0 * highlightIntensity,
                      spreadRadius: 1.0 * highlightIntensity,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Card(
            key: Key('room_session_card_${session.id}'),
            color: effectiveCardColor,
            clipBehavior: Clip.antiAlias,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(NyenyakTokens.radiusLg),
              side: BorderSide(
                color: effectiveBorderColor,
                width: effectiveBorderWidth,
              ),
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(NyenyakTokens.radiusLg),
              onTap: () => _showSessionDetailDialog(context),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (highlightIntensity > 0.01)
                    Opacity(
                      opacity: highlightIntensity,
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: FractionallySizedBox(
                          widthFactor: (1.0 - _fadeController.value).clamp(
                            0.0,
                            1.0,
                          ),
                          child: Container(
                            height: 3.0,
                            color: NyenyakTokens.primary,
                          ),
                        ),
                      ),
                    ),
                  Padding(
                    padding: EdgeInsets.all(
                      isTabletLayout
                          ? NyenyakTokens.space5
                          : NyenyakTokens.space4,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Top Header: Status Badges and Indicators
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 7.0,
                                  height: 7.0,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isInProgress
                                        ? NyenyakTokens.primary
                                        : isCompleted
                                            ? mutedColor
                                            : NyenyakTokens.primaryHover,
                                  ),
                                ),
                                const SizedBox(width: NyenyakTokens.space2),
                                Text(
                                  session.localizedStatus.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 1.2,
                                    color: statusColor,
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (highlightIntensity > 0.01) ...[
                                  Opacity(
                                    opacity: highlightIntensity,
                                    child: Container(
                                      key: Key('new_session_badge_${session.id}'),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 7.0,
                                        vertical: 2.5,
                                      ),
                                      decoration: BoxDecoration(
                                        color: NyenyakTokens.primary,
                                        borderRadius: BorderRadius.circular(
                                          NyenyakTokens.radiusSm,
                                        ),
                                      ),
                                      child: const Text(
                                        'BARU',
                                        style: TextStyle(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 0.6,
                                          color: NyenyakTokens.primaryForeground,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6.0),
                                ],
                                if (session.isBooking)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6.5,
                                      vertical: 2.0,
                                    ),
                                    decoration: BoxDecoration(
                                      color: theme.colorScheme.secondary,
                                      borderRadius: BorderRadius.circular(
                                        NyenyakTokens.radiusSm,
                                      ),
                                    ),
                                    child: Text(
                                      'BOOKING',
                                      style: TextStyle(
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w600,
                                        letterSpacing: 0.8,
                                        color: mutedColor,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: NyenyakTokens.space3),

                        // Prominent Time Display: Live Timer when In Progress, otherwise Scheduled Range
                        if (isInProgress) ...[
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                _formatElapsedTimer(
                                  session.actualStartTime ??
                                      session.startTime ??
                                      DateTime.now(),
                                ),
                                style: TextStyle(
                                  fontSize: isTabletLayout ? 28.0 : 25.0,
                                  fontWeight: FontWeight.w200,
                                  letterSpacing: -0.6,
                                  height: 1.15,
                                  color: isDark
                                      ? NyenyakTokens.primary
                                      : NyenyakTokens.primaryHover,
                                  fontFeatures: const [
                                    FontFeature.tabularFigures(),
                                  ],
                                ),
                              ),
                              const SizedBox(width: NyenyakTokens.space2),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 5.5,
                                  vertical: 1.5,
                                ),
                                decoration: BoxDecoration(
                                  color: NyenyakTokens.primary.withValues(
                                    alpha: isDark ? 0.2 : 0.12,
                                  ),
                                  borderRadius: BorderRadius.circular(
                                    NyenyakTokens.radiusSm,
                                  ),
                                ),
                                child: Text(
                                  'BERJALAN',
                                  style: TextStyle(
                                    fontSize: 8.5,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.8,
                                    color: isDark
                                        ? NyenyakTokens.primary
                                        : NyenyakTokens.primaryHover,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6.0),
                          Wrap(
                            spacing: NyenyakTokens.space3,
                            runSpacing: 3.0,
                            children: [
                              Text(
                                'Jadwal: ${session.formattedSupposedTimeRange}',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w400,
                                  color: mutedColor,
                                  fontFeatures: const [
                                    FontFeature.tabularFigures(),
                                  ],
                                ),
                              ),
                              if (session.formattedActualStartTime != null &&
                                  session.formattedProjectedEndTime != null) ...[
                                Text(
                                  'Mulai ${session.formattedActualStartTime} · Est. Selesai ${session.formattedProjectedEndTime}',
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w500,
                                    color: isDark
                                        ? NyenyakTokens.primary
                                        : NyenyakTokens.primaryHover,
                                    fontFeatures: const [
                                      FontFeature.tabularFigures(),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ] else ...[
                          Text(
                            session.formattedTimeRange,
                            style: TextStyle(
                              fontSize: isTabletLayout ? 28.0 : 25.0,
                              fontWeight: FontWeight.w200,
                              letterSpacing: -0.6,
                              height: 1.15,
                              color: isCompleted
                                  ? mutedColor
                                  : theme.colorScheme.onSurface,
                              fontFeatures: const [
                                FontFeature.tabularFigures(),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: NyenyakTokens.space3),

                        // Service Item Name
                        Text(
                          session.itemName,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontSize: isTabletLayout ? 16.0 : 15.0,
                            fontWeight: FontWeight.w500,
                            letterSpacing: -0.2,
                            color: isCompleted
                                ? mutedColor
                                : theme.colorScheme.onSurface,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: NyenyakTokens.space4),

                        // Subtle Divider
                        Container(
                          height: 1.0,
                          color: dividerColor.withValues(alpha: 0.5),
                        ),
                        const SizedBox(height: NyenyakTokens.space3),

                        // Highlighted Customer & Therapist Information
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            // Customer
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'TAMU',
                                    style: TextStyle(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: 1.1,
                                      color: mutedColor,
                                    ),
                                  ),
                                  const SizedBox(height: 2.0),
                                  Text(
                                    session.customerName,
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      fontSize: isTabletLayout ? 13.5 : 12.5,
                                      fontWeight: FontWeight.w500,
                                      letterSpacing: -0.1,
                                      color: isCompleted
                                          ? mutedColor
                                          : theme.colorScheme.onSurface,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: NyenyakTokens.space3),

                            // Therapist - Prominently Highlighted with Badge Container
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10.0,
                                  vertical: 6.0,
                                ),
                                decoration: BoxDecoration(
                                  color: session.staffName != null
                                      ? (isCompleted
                                          ? theme.colorScheme.secondary
                                          : NyenyakTokens.primary
                                              .withValues(alpha: isDark ? 0.16 : 0.10))
                                      : theme.colorScheme.secondary.withValues(alpha: 0.6),
                                  borderRadius: BorderRadius.circular(
                                    NyenyakTokens.radiusMd,
                                  ),
                                  border: Border.all(
                                    color: session.staffName != null && !isCompleted
                                        ? NyenyakTokens.primary.withValues(alpha: 0.35)
                                        : theme.colorScheme.outline.withValues(alpha: 0.5),
                                    width: 1.0,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.person_outline,
                                          size: 11.0,
                                          color: session.staffName != null && !isCompleted
                                              ? NyenyakTokens.primaryHover
                                              : mutedColor,
                                        ),
                                        const SizedBox(width: 4.0),
                                        Text(
                                          'TERAPIS',
                                          style: TextStyle(
                                            fontSize: 9.0,
                                            fontWeight: FontWeight.w700,
                                            letterSpacing: 1.1,
                                            color: session.staffName != null && !isCompleted
                                              ? NyenyakTokens.primaryHover
                                              : mutedColor,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 2.0),
                                    Text(
                                      session.staffName ?? 'Belum ditentukan',
                                      style: TextStyle(
                                        fontSize: isTabletLayout ? 14.5 : 13.5,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: -0.2,
                                        color: session.staffName != null
                                            ? (isCompleted
                                                ? mutedColor
                                                : (isDark
                                                    ? NyenyakTokens.primary
                                                    : NyenyakTokens.primaryHover))
                                            : mutedColor,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Placeholder dialog shown upon clicking a session card.
/// More interactive operations will be added here subsequently.
class _SessionDetailDialog extends StatefulWidget {
  const _SessionDetailDialog({
    required this.session,
    this.verificationRecord,
    this.staffFaceController,
    this.roomListController,
    this.onOpenStaffFaceDrawer,
  });

  final RoomServiceSession session;
  final VerifiedSessionRecord? verificationRecord;
  final StaffFaceController? staffFaceController;
  final RoomListController? roomListController;
  final VoidCallback? onOpenStaffFaceDrawer;

  @override
  State<_SessionDetailDialog> createState() => _SessionDetailDialogState();
}

class _SessionDetailDialogState extends State<_SessionDetailDialog> {
  bool _isProcessing = false;
  String? _errorMessage;
  Timer? _dialogTimer;

  @override
  void initState() {
    super.initState();
    if (widget.session.isInProgress) {
      _dialogTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) setState(() {});
      });
    }
  }

  @override
  void dispose() {
    _dialogTimer?.cancel();
    _dialogTimer = null;
    super.dispose();
  }

  Future<StaffFaceProfile?> _verifyTherapistFace(
    BuildContext context,
    StaffFaceController faceCtrl,
  ) async {
    final session = widget.session;
    final profile = faceCtrl.findProfile(
      staffId: session.staffId,
      staffName: session.staffName,
    );

    if (profile == null || !profile.hasFaceRegistered) {
      Navigator.of(context).pop();
      widget.onOpenStaffFaceDrawer?.call();
      return null;
    }

    final result = await Navigator.of(context).push<LivenessResult>(
      MaterialPageRoute<LivenessResult>(
        fullscreenDialog: true,
        builder: (pageContext) => FaceLivenessPage(
          mode: FaceRecognitionMode.verifyOneToOne,
          targetStaff: profile,
          onVerified: (res) => Navigator.of(pageContext).pop(res),
        ),
      ),
    );

    if (!mounted || result == null) return null;
    if (result.status == LivenessStatus.verified) {
      faceCtrl.markSessionVerified(
        sessionId: session.id,
        staff: profile,
        similarityScore: result.similarityScore ?? 1.0,
      );
      return profile;
    }
    return null;
  }

  Future<void> _handleSessionAction(String action) async {
    final faceCtrl = widget.staffFaceController;
    final roomCtrl = widget.roomListController;

    if (faceCtrl == null || roomCtrl == null) return;

    setState(() {
      _errorMessage = null;
    });

    final verifiedStaff = await _verifyTherapistFace(context, faceCtrl);
    if (!mounted || verifiedStaff == null) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      await roomCtrl.updateSessionStatus(
        sessionId: widget.session.id,
        action: action,
        staffId: verifiedStaff.id,
      );
      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dividerColor = theme.colorScheme.outline;
    final session = widget.session;
    final isScheduled = session.isScheduled;
    final isInProgress = session.isInProgress;
    final isCompleted = session.isCompleted;

    return Dialog(
      key: Key('session_detail_dialog_${session.id}'),
      backgroundColor: theme.colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(NyenyakTokens.radiusXl),
        side: BorderSide(color: dividerColor),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480.0),
        child: Padding(
          padding: const EdgeInsets.all(NyenyakTokens.space6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'DETAIL SESI LAYANAN',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.6,
                          color: NyenyakTokens.primaryHover,
                        ),
                      ),
                      const SizedBox(height: 2.0),
                      Text(
                        session.localizedStatus,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontSize: 18.0,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    tooltip: 'Tutup',
                    icon: const Icon(Icons.close, size: 20),
                  ),
                ],
              ),
              const SizedBox(height: NyenyakTokens.space4),
              Container(
                padding: const EdgeInsets.all(NyenyakTokens.space4),
                decoration: BoxDecoration(
                  color: theme.colorScheme.secondary.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
                  border: Border.all(color: dividerColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (isInProgress) ...[
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            _RoomSessionCardState._formatElapsedTimer(
                              session.actualStartTime ??
                                  session.startTime ??
                                  DateTime.now(),
                            ),
                            style: TextStyle(
                              fontSize: 26.0,
                              fontWeight: FontWeight.w200,
                              letterSpacing: -0.5,
                              color: NyenyakTokens.primaryHover,
                              fontFeatures: const [
                                FontFeature.tabularFigures(),
                              ],
                            ),
                          ),
                          const SizedBox(width: NyenyakTokens.space2),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 5.5,
                              vertical: 1.5,
                            ),
                            decoration: BoxDecoration(
                              color: NyenyakTokens.primary.withValues(
                                alpha: 0.15,
                              ),
                              borderRadius: BorderRadius.circular(
                                NyenyakTokens.radiusSm,
                              ),
                            ),
                            child: const Text(
                              'BERJALAN',
                              style: TextStyle(
                                fontSize: 8.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                                color: NyenyakTokens.primaryHover,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6.0),
                      Text(
                        'Jadwal: ${session.formattedSupposedTimeRange}',
                        style: TextStyle(
                          fontSize: 12.0,
                          color: theme.textTheme.bodySmall?.color,
                          fontFeatures: const [
                            FontFeature.tabularFigures(),
                          ],
                        ),
                      ),
                      if (session.formattedActualStartTime != null &&
                          session.formattedProjectedEndTime != null) ...[
                        const SizedBox(height: 2.0),
                        Text(
                          'Mulai: ${session.formattedActualStartTime} · Proyeksi Selesai: ${session.formattedProjectedEndTime}',
                          style: const TextStyle(
                            fontSize: 12.0,
                            fontWeight: FontWeight.w500,
                            color: NyenyakTokens.primaryHover,
                            fontFeatures: [
                              FontFeature.tabularFigures(),
                            ],
                          ),
                        ),
                      ],
                    ] else ...[
                      Text(
                        session.formattedTimeRange,
                        style: TextStyle(
                          fontSize: 24.0,
                          fontWeight: FontWeight.w200,
                          letterSpacing: -0.5,
                          color: theme.colorScheme.onSurface,
                          fontFeatures: const [FontFeature.tabularFigures()],
                        ),
                      ),
                    ],
                    const SizedBox(height: NyenyakTokens.space2),
                    Text(
                      session.itemName,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontSize: 16.0,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: NyenyakTokens.space4),
              _DetailRow(label: 'Nama Tamu', value: session.customerName),
              const SizedBox(height: NyenyakTokens.space2),
              _DetailRow(
                label: 'Terapis',
                value: session.staffName ?? 'Belum ditentukan',
              ),
              if (session.bookingNumber != null) ...[
                const SizedBox(height: NyenyakTokens.space2),
                _DetailRow(
                  label: 'No. Booking',
                  value: session.bookingNumber!,
                ),
              ],
              if (_errorMessage != null) ...[
                const SizedBox(height: NyenyakTokens.space3),
                Text(
                  _errorMessage!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: NyenyakTokens.destructive,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
              const SizedBox(height: NyenyakTokens.space6),

              // Action Buttons: Start or Stop Service with Face Verification
              if (!isCompleted &&
                  widget.roomListController != null &&
                  widget.staffFaceController != null) ...[
                if (isScheduled) ...[
                  FilledButton(
                    key: Key('start_session_button_${session.id}'),
                    onPressed: _isProcessing
                        ? null
                        : () => _handleSessionAction('START'),
                    child: _isProcessing
                        ? const SizedBox(
                            width: 18.0,
                            height: 18.0,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.0,
                              color: NyenyakTokens.primaryForeground,
                            ),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.play_arrow_rounded, size: 20.0),
                              SizedBox(width: 8.0),
                              Text('Mulai Layanan'),
                            ],
                          ),
                  ),
                  const SizedBox(height: 6.0),
                  Text(
                    'Verifikasi wajah terapis untuk memulai',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall?.copyWith(fontSize: 11.5),
                  ),
                ] else if (isInProgress) ...[
                  FilledButton(
                    key: Key('complete_session_button_${session.id}'),
                    onPressed: _isProcessing
                        ? null
                        : () => _handleSessionAction('COMPLETE'),
                    style: FilledButton.styleFrom(
                      backgroundColor: NyenyakTokens.success,
                      foregroundColor: Colors.white,
                    ),
                    child: _isProcessing
                        ? const SizedBox(
                            width: 18.0,
                            height: 18.0,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.0,
                              color: Colors.white,
                            ),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.check_circle_outline_rounded,
                                size: 19.0,
                              ),
                              SizedBox(width: 8.0),
                              Text('Selesaikan Layanan'),
                            ],
                          ),
                  ),
                  const SizedBox(height: 6.0),
                  Text(
                    'Verifikasi wajah terapis untuk menyelesaikan',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall?.copyWith(fontSize: 11.5),
                  ),
                ],
                const SizedBox(height: NyenyakTokens.space3),
              ],
              OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(40.0),
                  side: BorderSide(color: dividerColor),
                ),
                child: const Text('Tutup'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(fontSize: 13.0),
        ),
        Text(
          value,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            fontSize: 13.5,
          ),
        ),
      ],
    );
  }
}

class _RoomHistoryDrawer extends StatelessWidget {
  const _RoomHistoryDrawer({
    required this.room,
    required this.roomListController,
    required this.onClose,
  });

  final PortalRoom room;
  final RoomListController roomListController;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dividerColor = theme.colorScheme.outline;
    final screenWidth = MediaQuery.sizeOf(context).width;
    final drawerWidth = screenWidth >= 520 ? 420.0 : screenWidth * 0.88;

    return Material(
      key: const Key('room_history_drawer'),
      color: theme.colorScheme.surface,
      child: SafeArea(
        child: Container(
          width: drawerWidth,
          height: double.infinity,
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(color: dividerColor, width: 1.0),
            ),
          ),
          child: ListenableBuilder(
            listenable: roomListController,
            builder: (context, _) {
              final filterDate = roomListController.historyFilterDate;
              final now = DateTime.now();
              final isToday = filterDate.year == now.year &&
                  filterDate.month == now.month &&
                  filterDate.day == now.day;

              final completedSessions = roomListController.roomSessions
                  .where((s) => s.isCompleted)
                  .toList();

              String formatDisplayDate(DateTime dt) {
                final day = dt.day.toString().padLeft(2, '0');
                const months = <String>[
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'Mei',
                  'Jun',
                  'Jul',
                  'Agu',
                  'Sep',
                  'Okt',
                  'Nov',
                  'Des'
                ];
                final month = months[dt.month - 1];
                final year = dt.year;
                return '$day $month $year';
              }

              Future<void> pickDate() async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: filterDate,
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                  builder: (context, child) {
                    return Theme(
                      data: theme.copyWith(
                        colorScheme: theme.colorScheme.copyWith(
                          primary: NyenyakTokens.primary,
                          onPrimary: NyenyakTokens.primaryForeground,
                        ),
                      ),
                      child: child!,
                    );
                  },
                );
                if (picked != null) {
                  roomListController.setHistoryFilterDate(picked);
                }
              }

              final dateLabel = isToday
                  ? 'Hari Ini (${formatDisplayDate(filterDate)})'
                  : formatDisplayDate(filterDate);

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    height: 2.0,
                    color: NyenyakTokens.primary,
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: NyenyakTokens.space5,
                      vertical: NyenyakTokens.space4,
                    ),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: dividerColor, width: 1.0),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'ARSIP RIWAYAT',
                                    style: TextStyle(
                                      fontSize: 10.0,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: 1.6,
                                      color: NyenyakTokens.primaryHover,
                                    ),
                                  ),
                                  const SizedBox(height: 2.0),
                                  Text(
                                    'Riwayat Sesi Selesai',
                                    style: theme.textTheme.titleMedium?.copyWith(
                                      fontSize: 18.0,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                  const SizedBox(height: 2.0),
                                  Text(
                                    '${room.name} · ${completedSessions.length} sesi selesai',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      fontSize: 12.5,
                                      fontFeatures: const [
                                        FontFeature.tabularFigures(),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              key: const Key('close_history_drawer_button'),
                              onPressed: onClose,
                              tooltip: 'Tutup riwayat',
                              icon: const Icon(Icons.close, size: 20),
                            ),
                          ],
                        ),
                        const SizedBox(height: NyenyakTokens.space3),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                key: const Key('history_date_picker_button'),
                                onPressed: pickDate,
                                icon: const Icon(
                                  Icons.calendar_today_outlined,
                                  size: 15.0,
                                  color: NyenyakTokens.primaryHover,
                                ),
                                label: Text(
                                  dateLabel,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                style: OutlinedButton.styleFrom(
                                  visualDensity: VisualDensity.compact,
                                  minimumSize: const Size(0, 36.0),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: NyenyakTokens.space3,
                                  ),
                                  side: BorderSide(color: dividerColor),
                                  foregroundColor: theme.colorScheme.onSurface,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(
                                      NyenyakTokens.radiusMd,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            if (!isToday) ...[
                              const SizedBox(width: NyenyakTokens.space2),
                              TextButton(
                                key: const Key('history_reset_today_button'),
                                onPressed: () => roomListController
                                    .setHistoryFilterDate(DateTime.now()),
                                style: TextButton.styleFrom(
                                  visualDensity: VisualDensity.compact,
                                  minimumSize: const Size(0, 36.0),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: NyenyakTokens.space2,
                                  ),
                                  foregroundColor: NyenyakTokens.primaryHover,
                                  textStyle: const TextStyle(
                                    fontSize: 12.0,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                child: const Text('Hari Ini'),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: completedSessions.isEmpty
                        ? Padding(
                            padding: const EdgeInsets.all(NyenyakTokens.space6),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Belum ada riwayat sesi selesai',
                                  style: theme.textTheme.titleMedium,
                                ),
                                const SizedBox(height: NyenyakTokens.space1),
                                Text(
                                  'Sesi layanan di ${room.name} yang telah diselesaikan pada tanggal terpilih ($dateLabel) akan tercatat di sini.',
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(NyenyakTokens.space5),
                            itemCount: completedSessions.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: NyenyakTokens.space3),
                            itemBuilder: (context, index) {
                              return _RoomSessionCard(
                                session: completedSessions[index],
                                isTabletLayout: true,
                                staffFaceController:
                                    roomListController is Widget ? null : null,
                              );
                            },
                          ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
