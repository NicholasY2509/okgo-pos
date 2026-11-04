import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/portal_room.dart';
import '../services/room_notification_sound_service.dart';
import '../services/room_service.dart';
import '../services/room_socket_service.dart';

/// Manages presentation state for the branch's room list, selected room binding,
/// arranged room sessions, live Socket.io updates, notification sound & toast,
/// and 10-second new session highlight states.
class RoomListController extends ChangeNotifier {
  RoomListController({
    required RoomService roomService,
    RoomSocketClient? socketClient,
    NotificationSoundPlayer? soundPlayer,
    Duration newSessionHighlightDuration = const Duration(seconds: 10),
    Duration toastDuration = const Duration(seconds: 6),
  })  : _roomService = roomService,
        _socketClient = socketClient ?? SocketIoRoomClient(),
        _soundPlayer = soundPlayer ?? const PlatformNotificationSoundPlayer(),
        _newSessionHighlightDuration = newSessionHighlightDuration,
        _toastDuration = toastDuration;

  final RoomService _roomService;
  final RoomSocketClient _socketClient;
  final NotificationSoundPlayer _soundPlayer;
  final Duration _newSessionHighlightDuration;
  final Duration _toastDuration;

  bool _isLoading = false;
  String? _loadedBranchId;
  String? _errorMessage;
  List<PortalRoom> _rooms = const <PortalRoom>[];

  PortalRoom? _selectedRoom;
  bool _isLoadingSessions = false;
  String? _sessionsErrorMessage;
  List<RoomServiceSession> _roomSessions = const <RoomServiceSession>[];
  String _sessionSearchQuery = '';
  bool _isSocketConnected = false;
  DateTime _historyFilterDate = DateTime.now();

  bool _hasInitializedRoomSessions = false;
  Set<String> _knownSessionIds = <String>{};
  final Set<String> _newlyAddedSessionIds = <String>{};
  final Map<String, Timer> _newSessionTimers = <String, Timer>{};
  List<RoomServiceSession> _activeToastSessions = const <RoomServiceSession>[];
  int _toastNotificationVersion = 0;
  Timer? _toastDismissTimer;

  bool get isLoading => _isLoading;
  String? get loadedBranchId => _loadedBranchId;
  String? get errorMessage => _errorMessage;
  List<PortalRoom> get rooms => _rooms;

  PortalRoom? get selectedRoom => _selectedRoom;
  bool get isLoadingSessions => _isLoadingSessions;
  String? get sessionsErrorMessage => _sessionsErrorMessage;
  List<RoomServiceSession> get roomSessions => _roomSessions;
  String get sessionSearchQuery => _sessionSearchQuery;
  bool get isSocketConnected => _isSocketConnected;
  DateTime get historyFilterDate => _historyFilterDate;

  /// Sets the date used to query and filter completed session history.
  /// Defaults to today.
  void setHistoryFilterDate(DateTime date) {
    final normalized = DateTime(date.year, date.month, date.day);
    if (_historyFilterDate.year == normalized.year &&
        _historyFilterDate.month == normalized.month &&
        _historyFilterDate.day == normalized.day) {
      return;
    }
    _historyFilterDate = normalized;
    notifyListeners();
    loadSelectedRoomSessions();
  }

  Duration get newSessionHighlightDuration => _newSessionHighlightDuration;
  Set<String> get newlyAddedSessionIds =>
      Set<String>.unmodifiable(_newlyAddedSessionIds);
  List<RoomServiceSession> get activeToastSessions => _activeToastSessions;
  int get toastNotificationVersion => _toastNotificationVersion;

  /// Returns `true` while [sessionId] is within the 10-second new-service highlight window.
  bool isNewSession(String sessionId) =>
      _newlyAddedSessionIds.contains(sessionId);

  /// Dismisses the active new-service toast notification banner immediately.
  void dismissNewSessionToast() {
    _toastDismissTimer?.cancel();
    _toastDismissTimer = null;
    if (_activeToastSessions.isEmpty) {
      return;
    }
    _activeToastSessions = const <RoomServiceSession>[];
    notifyListeners();
  }

  void _clearNewSessionTracking() {
    for (final timer in _newSessionTimers.values) {
      timer.cancel();
    }
    _newSessionTimers.clear();
    _newlyAddedSessionIds.clear();
    _knownSessionIds.clear();
    _hasInitializedRoomSessions = false;
    _toastDismissTimer?.cancel();
    _toastDismissTimer = null;
    _activeToastSessions = const <RoomServiceSession>[];
  }

  /// All ongoing (`IN_PROGRESS`) and upcoming (`SCHEDULED`) sessions for [selectedRoom].
  List<RoomServiceSession> get activeAndUpcomingSessions =>
      _roomSessions.where((s) => !s.isCompleted).toList(growable: false);

  /// Active and upcoming sessions filtered by [sessionSearchQuery]
  /// (matching service name, customer name, or therapist name).
  List<RoomServiceSession> get filteredActiveAndUpcomingSessions =>
      _roomSessions
          .where((s) => !s.isCompleted && s.matchesQuery(_sessionSearchQuery))
          .toList(growable: false);

  void setSessionSearchQuery(String query) {
    if (_sessionSearchQuery == query) {
      return;
    }
    _sessionSearchQuery = query;
    notifyListeners();
  }

  Future<void> loadRooms(String branchId, {bool forceRefresh = false}) async {
    final trimmed = branchId.trim();
    if (trimmed.isEmpty) {
      return;
    }

    if (_isLoading) {
      return;
    }

    if (!forceRefresh && _loadedBranchId == trimmed && _errorMessage == null) {
      return;
    }

    _isLoading = true;
    _loadedBranchId = trimmed;
    _errorMessage = null;
    notifyListeners();

    final result = await _roomService.getRoomsForBranch(trimmed);

    _isLoading = false;

    if (result.isSuccess) {
      _rooms = result.rooms;
    } else {
      _rooms = const <PortalRoom>[];
      _errorMessage = result.errorMessage ?? 'Gagal memuat daftar ruangan.';
    }

    notifyListeners();
  }

  /// Assigns this device view to [room], persists the selection locally,
  /// fetches its arranged sessions, and connects to the live Socket.io channel
  /// for automatic updates.
  Future<void> selectRoom(PortalRoom room) async {
    _clearNewSessionTracking();
    _selectedRoom = room;
    _sessionsErrorMessage = null;
    _roomSessions = const <RoomServiceSession>[];
    _sessionSearchQuery = '';
    notifyListeners();

    await _roomService.saveSelectedRoom(room);

    _socketClient.connect(
      branchId: room.branchId,
      roomId: room.id,
      onRoomEvent: () {
        loadSelectedRoomSessions(silent: true);
      },
      onConnectionChanged: (connected) {
        if (_isSocketConnected != connected) {
          _isSocketConnected = connected;
          notifyListeners();
        }
      },
    );

    await loadSelectedRoomSessions();
  }

  /// Hydrates a previously bound [PortalRoom] for [branchId] from local device storage.
  Future<PortalRoom?> restoreSelectedRoom(String branchId) async {
    final savedRoom = await _roomService.getSavedRoom();
    if (savedRoom == null || savedRoom.branchId != branchId.trim()) {
      return null;
    }
    await selectRoom(savedRoom);
    return _selectedRoom;
  }

  /// Unbinds the currently selected room and returns to the room selection grid.
  void unselectRoom() {
    _socketClient.disconnect();
    _roomService.clearSavedRoom();
    _clearNewSessionTracking();
    _selectedRoom = null;
    _isLoadingSessions = false;
    _sessionsErrorMessage = null;
    _roomSessions = const <RoomServiceSession>[];
    _sessionSearchQuery = '';
    _isSocketConnected = false;
    notifyListeners();
  }

  /// Loads or refreshes the sessions arranged for [selectedRoom].
  Future<void> loadSelectedRoomSessions({bool silent = false}) async {
    final room = _selectedRoom;
    if (room == null) {
      return;
    }

    if (!silent) {
      _isLoadingSessions = true;
      _sessionsErrorMessage = null;
      notifyListeners();
    }

    final result = await _roomService.getSessionsForRoom(
      branchId: room.branchId,
      roomId: room.id,
      date: _historyFilterDate,
    );

    // Guard against stale response if room was unselected or switched mid-flight
    if (_selectedRoom?.id != room.id) {
      return;
    }

    _isLoadingSessions = false;

    if (result.isSuccess) {
      if (!_hasInitializedRoomSessions) {
        _hasInitializedRoomSessions = true;
        _knownSessionIds = result.sessions.map((s) => s.id).toSet();
      } else {
        final newSessions = result.sessions
            .where((s) => !s.isCompleted && !_knownSessionIds.contains(s.id))
            .toList(growable: false);

        for (final s in result.sessions) {
          _knownSessionIds.add(s.id);
        }

        if (newSessions.isNotEmpty) {
          unawaited(_soundPlayer.playNewServiceSound());

          for (final session in newSessions) {
            final sessionId = session.id;
            _newlyAddedSessionIds.add(sessionId);
            _newSessionTimers[sessionId]?.cancel();
            _newSessionTimers[sessionId] = Timer(
              _newSessionHighlightDuration,
              () {
                _newlyAddedSessionIds.remove(sessionId);
                _newSessionTimers.remove(sessionId);
                notifyListeners();
              },
            );
          }

          _activeToastSessions = List<RoomServiceSession>.unmodifiable(
            newSessions,
          );
          _toastNotificationVersion += 1;
          _toastDismissTimer?.cancel();
          _toastDismissTimer = Timer(_toastDuration, () {
            _activeToastSessions = const <RoomServiceSession>[];
            _toastDismissTimer = null;
            notifyListeners();
          });
        }
      }

      _roomSessions = result.sessions;
      _sessionsErrorMessage = null;
    } else if (!silent) {
      _roomSessions = const <RoomServiceSession>[];
      _sessionsErrorMessage =
          result.errorMessage ?? 'Gagal memuat jadwal sesi ruangan.';
    }

    notifyListeners();
  }

  /// Updates a service session status ('START' or 'COMPLETE') with a verified therapist ID.
  Future<void> updateSessionStatus({
    required String sessionId,
    required String action,
    required String staffId,
  }) async {
    final room = _selectedRoom;
    if (room == null) return;

    await _roomService.updateSessionStatus(
      sessionId: sessionId,
      branchId: room.branchId,
      action: action,
      staffId: staffId,
    );

    // Direct WebSocket broadcast from tablet so all POS timetable clients update immediately
    _socketClient.emitServiceStatusChanged(
      sessionId: sessionId,
      branchId: room.branchId,
      roomId: room.id,
      action: action,
      staffId: staffId,
    );

    // Refresh room sessions to reflect the updated state immediately
    await loadSelectedRoomSessions(silent: true);
  }

  void clear() {
    _socketClient.disconnect();
    _roomService.clearSavedRoom();
    _clearNewSessionTracking();
    _isLoading = false;
    _loadedBranchId = null;
    _errorMessage = null;
    _rooms = const <PortalRoom>[];
    _selectedRoom = null;
    _isLoadingSessions = false;
    _sessionsErrorMessage = null;
    _roomSessions = const <RoomServiceSession>[];
    _sessionSearchQuery = '';
    _isSocketConnected = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _clearNewSessionTracking();
    _socketClient.disconnect();
    super.dispose();
  }
}
