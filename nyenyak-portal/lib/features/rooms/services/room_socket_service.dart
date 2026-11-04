import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../../../core/config/api_config.dart';

/// Contract for subscribing to real-time Socket.io room session events.
abstract interface class RoomSocketClient {
  void connect({
    required String branchId,
    required String roomId,
    required VoidCallback onRoomEvent,
    ValueChanged<bool>? onConnectionChanged,
  });

  void disconnect();

  void emitServiceStatusChanged({
    required String sessionId,
    required String branchId,
    required String roomId,
    required String action,
    required String staffId,
  });
}

/// Production Socket.io client that joins the branch and room channels on `socket-server.js`.
class SocketIoRoomClient implements RoomSocketClient {
  SocketIoRoomClient({String? socketUrlOverride})
      : _socketUrlOverride = socketUrlOverride;

  final String? _socketUrlOverride;
  io.Socket? _socket;
  String? _activeRoomId;

  @override
  void connect({
    required String branchId,
    required String roomId,
    required VoidCallback onRoomEvent,
    ValueChanged<bool>? onConnectionChanged,
  }) {
    disconnect();

    _activeRoomId = roomId;
    final url = _socketUrlOverride != null && _socketUrlOverride.isNotEmpty
        ? _socketUrlOverride
        : ApiConfig.socketUrl;

    final socket = io.io(
      url,
      io.OptionBuilder()
          .setTransports(<String>['websocket', 'polling'])
          .disableAutoConnect()
          .enableReconnection()
          .build(),
    );

    void joinRooms() {
      socket.emit('join_branch', branchId);
      socket.emit('join_room', roomId);
      onConnectionChanged?.call(true);
    }

    bool matchesCurrentRoom(Object? payload) {
      if (payload is Map) {
        final eventBranchId = payload['branchId']?.toString();
        if (eventBranchId != null &&
            eventBranchId.isNotEmpty &&
            eventBranchId != branchId) {
          return false;
        }
        final eventRoomId = payload['roomId']?.toString();
        if (eventRoomId != null &&
            eventRoomId.isNotEmpty &&
            eventRoomId != roomId) {
          return false;
        }
      }
      return true;
    }

    void handleEvent(Object? data) {
      if (matchesCurrentRoom(data)) {
        onRoomEvent();
      }
    }

    socket.onConnect((_) => joinRooms());
    socket.onDisconnect((_) => onConnectionChanged?.call(false));
    socket.onConnectError((_) => onConnectionChanged?.call(false));

    socket.on('service_assigned', handleEvent);
    socket.on('service_status_changed', handleEvent);
    socket.on('new_booking', handleEvent);

    _socket = socket;
    socket.connect();
  }

  @override
  void emitServiceStatusChanged({
    required String sessionId,
    required String branchId,
    required String roomId,
    required String action,
    required String staffId,
  }) {
    final socket = _socket;
    if (socket != null && socket.connected) {
      socket.emit('service_status_changed', {
        'sessionId': sessionId,
        'branchId': branchId,
        'roomId': roomId,
        'action': action.toLowerCase(),
        'staffId': staffId,
      });
    }
  }

  @override
  void disconnect() {
    final socket = _socket;
    if (socket != null) {
      if (_activeRoomId != null) {
        socket.emit('leave_room', _activeRoomId);
      }
      socket.dispose();
      _socket = null;
    }
    _activeRoomId = null;
  }
}

/// Testable / offline no-op socket client.
class FakeRoomSocketClient implements RoomSocketClient {
  String? connectedBranchId;
  String? connectedRoomId;
  VoidCallback? _onRoomEvent;
  ValueChanged<bool>? _onConnectionChanged;

  bool get isConnected => connectedRoomId != null;

  @override
  void connect({
    required String branchId,
    required String roomId,
    required VoidCallback onRoomEvent,
    ValueChanged<bool>? onConnectionChanged,
  }) {
    connectedBranchId = branchId;
    connectedRoomId = roomId;
    _onRoomEvent = onRoomEvent;
    _onConnectionChanged = onConnectionChanged;
    _onConnectionChanged?.call(true);
  }

  /// Simulates an incoming Socket.io event (`service_assigned` / `service_status_changed`) in tests.
  void simulateRoomEvent() {
    _onRoomEvent?.call();
  }

  Map<String, dynamic>? lastEmittedStatusChanged;

  @override
  void emitServiceStatusChanged({
    required String sessionId,
    required String branchId,
    required String roomId,
    required String action,
    required String staffId,
  }) {
    lastEmittedStatusChanged = {
      'sessionId': sessionId,
      'branchId': branchId,
      'roomId': roomId,
      'action': action.toLowerCase(),
      'staffId': staffId,
    };
  }

  @override
  void disconnect() {
    connectedBranchId = null;
    connectedRoomId = null;
    _onRoomEvent = null;
    _onConnectionChanged?.call(false);
    _onConnectionChanged = null;
  }
}

