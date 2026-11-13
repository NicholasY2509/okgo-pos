import 'package:flutter/material.dart';
import '../../../../core/theme/nyenyak_tokens.dart';
import '../../controllers/staff_face_controller.dart';
import '../../models/face_profile.dart';
import '../../models/liveness_result.dart';
import '../pages/face_liveness_page.dart';

/// Slide-over drawer for managing branch staff face registration (enrollment),
/// 1:1 face verification, and 1:N live staff face identification.
///
/// Designed to match the minimalist, quiet-luxury architectural language
/// of Nyenyak Portal (`_RoomHistoryDrawer` and `_RoomStationSidebar`).
class StaffFaceManagementDrawer extends StatefulWidget {
  const StaffFaceManagementDrawer({
    super.key,
    required this.branchId,
    required this.branchName,
    required this.controller,
    required this.onClose,
  });

  final String branchId;
  final String branchName;
  final StaffFaceController controller;
  final VoidCallback onClose;

  @override
  State<StaffFaceManagementDrawer> createState() =>
      _StaffFaceManagementDrawerState();
}

class _StaffFaceManagementDrawerState extends State<StaffFaceManagementDrawer> {
  final TextEditingController _searchController = TextEditingController();
  String? _statusBannerMessage;
  bool _statusBannerSuccess = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        widget.controller.loadProfiles(widget.branchId);
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _openRegistrationScanner(StaffFaceProfile staff) async {
    final result = await Navigator.of(context).push<LivenessResult>(
      MaterialPageRoute<LivenessResult>(
        fullscreenDialog: true,
        builder: (pageContext) => FaceLivenessPage(
          mode: FaceRecognitionMode.register,
          targetStaff: staff,
          onVerified: (res) => Navigator.of(pageContext).pop(res),
        ),
      ),
    );

    if (!mounted || result == null) return;
    final embedding = result.extractedEmbedding;
    if (embedding == null || embedding.isEmpty) return;

    final updated = await widget.controller.registerStaffFace(
      branchId: widget.branchId,
      staffId: staff.id,
      embedding: embedding,
    );

    if (!mounted) return;
    setState(() {
      if (updated != null) {
        _statusBannerSuccess = true;
        _statusBannerMessage =
            'Biometrik wajah ${updated.name} berhasil disimpan.';
      } else {
        _statusBannerSuccess = false;
        _statusBannerMessage =
            widget.controller.errorMessage ?? 'Gagal menyimpan data wajah.';
      }
    });
  }

  Future<void> _openVerifyOneToOneScanner(StaffFaceProfile staff) async {
    final result = await Navigator.of(context).push<LivenessResult>(
      MaterialPageRoute<LivenessResult>(
        fullscreenDialog: true,
        builder: (pageContext) => FaceLivenessPage(
          mode: FaceRecognitionMode.verifyOneToOne,
          targetStaff: staff,
          onVerified: (res) => Navigator.of(pageContext).pop(res),
        ),
      ),
    );

    if (!mounted || result == null) return;
    final pct = ((result.similarityScore ?? 0.0).clamp(0.0, 1.0) * 100)
        .toStringAsFixed(1);
    setState(() {
      _statusBannerSuccess = true;
      _statusBannerMessage =
          'Terverifikasi sebagai ${staff.name} · Akurasi $pct%';
    });
  }

  Future<void> _openIdentifyOneToManyScanner() async {
    final registered = widget.controller.registeredProfiles;
    if (registered.isEmpty) {
      setState(() {
        _statusBannerSuccess = false;
        _statusBannerMessage =
            'Belum ada staf dengan biometrik terdaftar di cabang ini.';
      });
      return;
    }

    final result = await Navigator.of(context).push<LivenessResult>(
      MaterialPageRoute<LivenessResult>(
        fullscreenDialog: true,
        builder: (pageContext) => FaceLivenessPage(
          mode: FaceRecognitionMode.identifyOneToMany,
          candidateProfiles: registered,
          onVerified: (res) => Navigator.of(pageContext).pop(res),
        ),
      ),
    );

    if (!mounted || result == null) return;
    final matched = result.matchedStaff;
    final pct = ((result.similarityScore ?? 0.0).clamp(0.0, 1.0) * 100)
        .toStringAsFixed(1);
    if (matched != null) {
      setState(() {
        _statusBannerSuccess = true;
        _statusBannerMessage =
            'Teridentifikasi: ${matched.name} (${matched.position}) · $pct%';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dividerColor = theme.colorScheme.outline;
    final screenWidth = MediaQuery.sizeOf(context).width;
    final drawerWidth = screenWidth >= 540 ? 460.0 : screenWidth * 0.90;

    return Material(
      key: const Key('staff_face_management_drawer'),
      color: theme.colorScheme.surface,
      elevation: 0,
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
            listenable: widget.controller,
            builder: (context, _) {
              final profiles = widget.controller.filteredProfiles;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    height: 2.0,
                    color: NyenyakTokens.primary,
                  ),
                  _buildHeader(theme, dividerColor),
                  _buildMetricsAndQuickAction(theme, dividerColor),
                  if (_statusBannerMessage != null)
                    _buildStatusBanner(theme, dividerColor),
                  _buildSearchAndFilters(theme, dividerColor),
                  Expanded(
                    child: widget.controller.isLoading &&
                            widget.controller.profiles.isEmpty
                        ? Center(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const SizedBox(
                                  width: 16.0,
                                  height: 16.0,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.0,
                                    color: NyenyakTokens.primary,
                                  ),
                                ),
                                const SizedBox(width: NyenyakTokens.space3),
                                Text(
                                  'Memuat direktori staf...',
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          )
                        : profiles.isEmpty
                            ? _buildEmptyState(theme)
                            : ListView.separated(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: NyenyakTokens.space5,
                                  vertical: NyenyakTokens.space4,
                                ),
                                itemCount: profiles.length,
                                separatorBuilder: (_, _) => const SizedBox(
                                  height: NyenyakTokens.space2 + 2,
                                ),
                                itemBuilder: (context, index) {
                                  final staff = profiles[index];
                                  return _StaffFaceCard(
                                    key: Key('staff_face_card_${staff.id}'),
                                    staff: staff,
                                    isSaving: widget.controller.isSaving,
                                    onRegister: () =>
                                        _openRegistrationScanner(staff),
                                    onVerify: staff.hasFaceRegistered
                                        ? () => _openVerifyOneToOneScanner(staff)
                                        : null,
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

  Widget _buildHeader(ThemeData theme, Color dividerColor) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: NyenyakTokens.space5,
        vertical: NyenyakTokens.space4,
      ),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: dividerColor, width: 1.0),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'BIOMETRIK & IDENTITAS STAF',
                  style: TextStyle(
                    fontSize: 10.0,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.6,
                    color: NyenyakTokens.primaryHover,
                  ),
                ),
                const SizedBox(height: 2.0),
                Text(
                  'Registrasi & Verifikasi Wajah',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontSize: 18.0,
                    fontWeight: FontWeight.w400,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 2.0),
                Text(
                  '${widget.branchName} · Sinkronisasi perangkat cabang',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontSize: 12.5,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Muat ulang data wajah',
            visualDensity: VisualDensity.compact,
            onPressed: widget.controller.isLoading
                ? null
                : () => widget.controller.loadProfiles(
                      widget.branchId,
                      forceRefresh: true,
                    ),
            icon: Icon(
              Icons.refresh,
              size: 18.0,
              color: theme.textTheme.bodySmall?.color,
            ),
          ),
          IconButton(
            key: const Key('close_staff_face_drawer_button'),
            tooltip: 'Tutup panel biometrik',
            visualDensity: VisualDensity.compact,
            onPressed: widget.onClose,
            icon: const Icon(Icons.close, size: 20.0),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsAndQuickAction(ThemeData theme, Color dividerColor) {
    final registered = widget.controller.registeredCount;
    final unregistered = widget.controller.unregisteredCount;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: NyenyakTokens.space5,
        vertical: NyenyakTokens.space4,
      ),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: dividerColor, width: 1.0),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          _DrawerMetricColumn(
            value: '$registered',
            label: 'TERDAFTAR',
            highlight: registered > 0,
          ),
          const SizedBox(width: NyenyakTokens.space5),
          Container(
            width: 1.0,
            height: 30.0,
            color: dividerColor,
          ),
          const SizedBox(width: NyenyakTokens.space5),
          _DrawerMetricColumn(
            value: '$unregistered',
            label: 'BELUM TERDAFTAR',
          ),
          const Spacer(),
          OutlinedButton.icon(
            key: const Key('identify_face_1_to_n_button'),
            onPressed: _openIdentifyOneToManyScanner,
            icon: const Icon(
              Icons.center_focus_weak_rounded,
              size: 16.0,
              color: NyenyakTokens.primaryHover,
            ),
            label: const Text('Pindai (1:N)'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(0, 36.0),
              padding: const EdgeInsets.symmetric(
                horizontal: NyenyakTokens.space3,
                vertical: NyenyakTokens.space2,
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
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBanner(ThemeData theme, Color dividerColor) {
    final accentColor =
        _statusBannerSuccess ? NyenyakTokens.success : NyenyakTokens.destructive;
    return Container(
      key: const Key('face_drawer_status_banner'),
      padding: const EdgeInsets.symmetric(
        horizontal: NyenyakTokens.space5,
        vertical: NyenyakTokens.space3,
      ),
      decoration: BoxDecoration(
        color: accentColor.withValues(alpha: 0.06),
        border: Border(
          bottom: BorderSide(color: dividerColor, width: 1.0),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 6.0,
            height: 6.0,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: accentColor,
            ),
          ),
          const SizedBox(width: NyenyakTokens.space3),
          Expanded(
            child: Text(
              _statusBannerMessage!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface,
                fontWeight: FontWeight.w500,
                fontSize: 12.5,
              ),
            ),
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
            icon: Icon(
              Icons.close,
              size: 15.0,
              color: theme.textTheme.bodySmall?.color,
            ),
            onPressed: () => setState(() => _statusBannerMessage = null),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilters(ThemeData theme, Color dividerColor) {
    final currentFilter = widget.controller.filter;

    return Container(
      padding: const EdgeInsets.fromLTRB(
        NyenyakTokens.space5,
        NyenyakTokens.space4,
        NyenyakTokens.space5,
        NyenyakTokens.space3,
      ),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: dividerColor, width: 1.0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            key: const Key('staff_face_search_input'),
            controller: _searchController,
            onChanged: widget.controller.setSearchQuery,
            style: theme.textTheme.bodyMedium?.copyWith(fontSize: 13.5),
            decoration: InputDecoration(
              hintText: 'Cari nama staf, ID, atau posisi...',
              prefixIcon: Icon(
                Icons.search,
                size: 17.0,
                color: theme.textTheme.bodySmall?.color,
              ),
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: NyenyakTokens.space3,
                vertical: 11.0,
              ),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close, size: 16.0),
                      onPressed: () {
                        _searchController.clear();
                        widget.controller.setSearchQuery('');
                      },
                    )
                  : null,
            ),
          ),
          const SizedBox(height: NyenyakTokens.space3),
          Row(
            children: [
              _FilterTabPill(
                label: 'Semua',
                count: widget.controller.totalCount,
                selected: currentFilter == StaffFaceFilter.all,
                onTap: () => widget.controller.setFilter(StaffFaceFilter.all),
              ),
              const SizedBox(width: NyenyakTokens.space2),
              _FilterTabPill(
                label: 'Terdaftar',
                count: widget.controller.registeredCount,
                selected: currentFilter == StaffFaceFilter.registered,
                onTap: () =>
                    widget.controller.setFilter(StaffFaceFilter.registered),
              ),
              const SizedBox(width: NyenyakTokens.space2),
              _FilterTabPill(
                label: 'Belum',
                count: widget.controller.unregisteredCount,
                selected: currentFilter == StaffFaceFilter.unregistered,
                onTap: () =>
                    widget.controller.setFilter(StaffFaceFilter.unregistered),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.all(NyenyakTokens.space6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tidak ada staf yang ditemukan',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(height: NyenyakTokens.space1),
          Text(
            widget.controller.errorMessage ??
                'Sesuaikan kata kunci pencarian atau filter status registrasi di atas.',
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _DrawerMetricColumn extends StatelessWidget {
  const _DrawerMetricColumn({
    required this.value,
    required this.label,
    this.highlight = false,
  });

  final String value;
  final String label;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: theme.textTheme.titleLarge?.copyWith(
            fontSize: 22.0,
            fontWeight: FontWeight.w300,
            color: highlight
                ? NyenyakTokens.primaryHover
                : theme.colorScheme.onSurface,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
        const SizedBox(height: 1.0),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            fontSize: 9.5,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.1,
          ),
        ),
      ],
    );
  }
}

class _FilterTabPill extends StatelessWidget {
  const _FilterTabPill({
    required this.label,
    required this.count,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final int count;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final borderColor = selected
        ? NyenyakTokens.primary.withValues(alpha: 0.65)
        : theme.colorScheme.outline;
    final backgroundColor = selected
        ? NyenyakTokens.primary.withValues(alpha: isDark ? 0.14 : 0.08)
        : Colors.transparent;

    return InkWell(
      borderRadius: BorderRadius.circular(NyenyakTokens.radiusSm),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: NyenyakTokens.space3,
          vertical: 5.0,
        ),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(NyenyakTokens.radiusSm),
          border: Border.all(color: borderColor, width: 1.0),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12.0,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                color: selected
                    ? theme.colorScheme.onSurface
                    : theme.textTheme.bodySmall?.color,
              ),
            ),
            const SizedBox(width: 5.0),
            Text(
              '$count',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w500,
                color: selected
                    ? NyenyakTokens.primaryHover
                    : theme.textTheme.bodySmall?.color,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StaffFaceCard extends StatelessWidget {
  const _StaffFaceCard({
    super.key,
    required this.staff,
    required this.isSaving,
    required this.onRegister,
    this.onVerify,
  });

  final StaffFaceProfile staff;
  final bool isSaving;
  final VoidCallback onRegister;
  final VoidCallback? onVerify;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final dividerColor = theme.colorScheme.outline;
    final isRegistered = staff.hasFaceRegistered;

    final cardColor = isRegistered
        ? Color.alphaBlend(
            NyenyakTokens.primary.withValues(alpha: isDark ? 0.05 : 0.025),
            theme.colorScheme.surface,
          )
        : theme.colorScheme.surface;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: NyenyakTokens.space4,
        vertical: NyenyakTokens.space3 + 2,
      ),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(NyenyakTokens.radiusLg),
        border: Border.all(
          color: isRegistered
              ? NyenyakTokens.primary.withValues(alpha: 0.35)
              : dividerColor,
          width: 1.0,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 36.0,
            height: 36.0,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isRegistered
                  ? NyenyakTokens.primary.withValues(alpha: 0.12)
                  : theme.colorScheme.secondary,
              borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
              border: Border.all(
                color: isRegistered
                    ? NyenyakTokens.primary.withValues(alpha: 0.3)
                    : dividerColor,
              ),
            ),
            child: Text(
              staff.initials,
              style: TextStyle(
                color: isRegistered
                    ? NyenyakTokens.primaryHover
                    : theme.textTheme.bodySmall?.color,
                fontWeight: FontWeight.w600,
                fontSize: 12.0,
                letterSpacing: 0.3,
              ),
            ),
          ),
          const SizedBox(width: NyenyakTokens.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        staff.name,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w500,
                          letterSpacing: -0.1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6.0),
                    Container(
                      width: 6.0,
                      height: 6.0,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isRegistered
                            ? NyenyakTokens.success
                            : dividerColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2.0),
                Text(
                  [
                    staff.position,
                    if (staff.staffIdNumber != null) staff.staffIdNumber!,
                    isRegistered ? 'Terdaftar' : 'Belum terdaftar',
                  ].join(' · '),
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontSize: 12.0,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: NyenyakTokens.space2),
          if (onVerify != null) ...[
            OutlinedButton(
              key: Key('verify_staff_face_button_${staff.id}'),
              onPressed: isSaving ? null : onVerify,
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(0, 32.0),
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(
                  horizontal: NyenyakTokens.space3,
                  vertical: 4.0,
                ),
                side: BorderSide(color: dividerColor),
                foregroundColor: theme.colorScheme.onSurface,
                textStyle: const TextStyle(
                  fontSize: 12.0,
                  fontWeight: FontWeight.w500,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(NyenyakTokens.radiusSm),
                ),
              ),
              child: const Text('Verifikasi'),
            ),
            const SizedBox(width: 6.0),
          ],
          OutlinedButton(
            key: Key('register_staff_face_button_${staff.id}'),
            onPressed: isSaving ? null : onRegister,
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(0, 32.0),
              visualDensity: VisualDensity.compact,
              backgroundColor: isRegistered
                  ? Colors.transparent
                  : NyenyakTokens.primary.withValues(alpha: isDark ? 0.14 : 0.08),
              padding: const EdgeInsets.symmetric(
                horizontal: NyenyakTokens.space3,
                vertical: 4.0,
              ),
              side: BorderSide(
                color: isRegistered
                    ? dividerColor
                    : NyenyakTokens.primary.withValues(alpha: 0.55),
              ),
              foregroundColor: isRegistered
                  ? theme.textTheme.bodySmall?.color
                  : theme.colorScheme.onSurface,
              textStyle: TextStyle(
                fontSize: 12.0,
                fontWeight: isRegistered ? FontWeight.w400 : FontWeight.w600,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(NyenyakTokens.radiusSm),
              ),
            ),
            child: Text(isRegistered ? 'Perbarui' : 'Registrasi'),
          ),
        ],
      ),
    );
  }
}
