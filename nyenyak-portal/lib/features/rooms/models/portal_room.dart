import 'package:flutter/foundation.dart';

/// Represents a physical service room in a Nyenyak branch.
@immutable
class PortalRoom {
  const PortalRoom({
    required this.id,
    required this.name,
    required this.isVip,
    required this.isActive,
    required this.branchId,
    this.capacity,
  });

  factory PortalRoom.fromJson(Map<String, dynamic> json) {
    final rawCapacity = json['capacity'];
    final capacity = switch (rawCapacity) {
      final int value => value,
      final num value => value.toInt(),
      _ => null,
    };

    return PortalRoom(
      id: (json['id'] as String?)?.trim() ?? '',
      name: (json['name'] as String?)?.trim() ?? '',
      capacity: capacity,
      isVip: json['isVip'] == true,
      isActive: json['isActive'] != false,
      branchId: (json['branchId'] as String?)?.trim() ?? '',
    );
  }

  final String id;
  final String name;
  final int? capacity;
  final bool isVip;
  final bool isActive;
  final String branchId;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      if (capacity != null) 'capacity': capacity,
      'isVip': isVip,
      'isActive': isActive,
      'branchId': branchId,
    };
  }
}

/// Represents a scheduled, in-progress, or completed service session assigned to a room.
@immutable
class RoomServiceSession {
  const RoomServiceSession({
    required this.id,
    required this.roomId,
    required this.branchId,
    required this.serviceId,
    required this.itemName,
    required this.customerName,
    required this.status,
    required this.isVip,
    required this.isBooking,
    this.staffId,
    this.staffName,
    this.bookingNumber,
    this.startTime,
    this.endTime,
    this.actualStartTime,
    this.actualEndTime,
  });

  factory RoomServiceSession.fromJson(Map<String, dynamic> json) {
    DateTime? parseTime(Object? raw) {
      if (raw is String && raw.isNotEmpty) {
        return DateTime.tryParse(raw)?.toLocal();
      }
      return null;
    }

    final rawStaffId = (json['staffId'] as String?)?.trim();
    final rawStaffName = (json['staffName'] as String?)?.trim();
    final rawBookingNum = (json['bookingNumber'] as String?)?.trim();

    return RoomServiceSession(
      id: (json['id'] as String?)?.trim() ?? '',
      roomId: (json['roomId'] as String?)?.trim() ?? '',
      branchId: (json['branchId'] as String?)?.trim() ?? '',
      serviceId: (json['serviceId'] as String?)?.trim() ?? '',
      itemName: (json['itemName'] as String?)?.trim() ?? 'Layanan',
      customerName: (json['customerName'] as String?)?.trim() ?? 'Walk-in',
      staffId:
          rawStaffId != null && rawStaffId.isNotEmpty ? rawStaffId : null,
      staffName:
          rawStaffName != null && rawStaffName.isNotEmpty ? rawStaffName : null,
      status: (json['status'] as String?)?.trim() ?? 'SCHEDULED',
      isVip: json['isVip'] == true,
      isBooking: json['isBooking'] == true,
      bookingNumber: rawBookingNum != null && rawBookingNum.isNotEmpty
          ? rawBookingNum
          : null,
      startTime: parseTime(json['startTime']),
      endTime: parseTime(json['endTime']),
      actualStartTime: parseTime(json['actualStartTime']),
      actualEndTime: parseTime(json['actualEndTime']),
    );
  }

  final String id;
  final String roomId;
  final String branchId;
  final String serviceId;
  final String itemName;
  final String customerName;
  final String? staffId;
  final String? staffName;
  final String status;
  final bool isVip;
  final bool isBooking;
  final String? bookingNumber;
  final DateTime? startTime;
  final DateTime? endTime;
  final DateTime? actualStartTime;
  final DateTime? actualEndTime;

  bool get isInProgress => status == 'IN_PROGRESS';
  bool get isScheduled => status == 'SCHEDULED';
  bool get isCompleted => status == 'COMPLETED';

  String get localizedStatus => switch (status) {
        'IN_PROGRESS' => 'Sedang Berlangsung',
        'COMPLETED' => 'Selesai',
        _ => 'Terjadwal',
      };

  static String _formatTimeOnly(DateTime dt) {
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    return '$hh:$mm';
  }

  /// Scheduled / Supposed time range (e.g. "14:00 – 15:00").
  String get formattedSupposedTimeRange {
    if (startTime != null && endTime != null) {
      return '${_formatTimeOnly(startTime!)} – ${_formatTimeOnly(endTime!)}';
    }
    if (startTime != null) {
      return 'Mulai ${_formatTimeOnly(startTime!)}';
    }
    if (endTime != null) {
      return 'Selesai ${_formatTimeOnly(endTime!)}';
    }
    return 'Waktu fleksibel';
  }

  /// Actual start time string (e.g. "14:05").
  String? get formattedActualStartTime {
    final actual = actualStartTime ?? (isInProgress ? startTime : null);
    if (actual != null) {
      return _formatTimeOnly(actual);
    }
    return null;
  }

  /// Projected end time calculated by applying the scheduled duration to the actual start time.
  DateTime? get projectedEndTime {
    final start = actualStartTime ?? startTime;
    if (start == null) return endTime;

    final duration = (startTime != null && endTime != null)
        ? endTime!.difference(startTime!)
        : const Duration(minutes: 60);

    return start.add(duration);
  }

  /// Projected end time string (e.g. "15:05").
  String? get formattedProjectedEndTime {
    final projected = projectedEndTime;
    if (projected != null) {
      return _formatTimeOnly(projected);
    }
    return null;
  }

  String get formattedTimeRange {
    final start = startTime ?? actualStartTime;
    final end = endTime ?? actualEndTime;
    if (start == null && end == null) {
      return 'Waktu fleksibel';
    }

    if (start != null && end != null) {
      return '${_formatTimeOnly(start)} – ${_formatTimeOnly(end)}';
    }
    if (start != null) {
      return 'Mulai ${_formatTimeOnly(start)}';
    }
    return 'Selesai ${_formatTimeOnly(end!)}';
  }

  /// Checks whether this session matches [rawQuery] by service name,
  /// customer name, or assigned therapist name (case-insensitive).
  bool matchesQuery(String rawQuery) {
    final query = rawQuery.trim().toLowerCase();
    if (query.isEmpty) {
      return true;
    }
    final serviceMatch = itemName.toLowerCase().contains(query);
    final customerMatch = customerName.toLowerCase().contains(query);
    final therapistMatch = (staffName ?? '').toLowerCase().contains(query);
    return serviceMatch || customerMatch || therapistMatch;
  }
}

/// Standardized result wrapper for branch room queries.
@immutable
class RoomListResult {
  const RoomListResult._({
    required this.isSuccess,
    this.rooms = const <PortalRoom>[],
    this.errorMessage,
  });

  factory RoomListResult.success(List<PortalRoom> rooms) {
    return RoomListResult._(isSuccess: true, rooms: List.unmodifiable(rooms));
  }

  factory RoomListResult.failure(String message) {
    return RoomListResult._(isSuccess: false, errorMessage: message);
  }

  final bool isSuccess;
  final List<PortalRoom> rooms;
  final String? errorMessage;
}

/// Standardized result wrapper for room session queries.
@immutable
class RoomSessionListResult {
  const RoomSessionListResult._({
    required this.isSuccess,
    this.sessions = const <RoomServiceSession>[],
    this.errorMessage,
  });

  factory RoomSessionListResult.success(List<RoomServiceSession> sessions) {
    return RoomSessionListResult._(
      isSuccess: true,
      sessions: List.unmodifiable(sessions),
    );
  }

  factory RoomSessionListResult.failure(String message) {
    return RoomSessionListResult._(isSuccess: false, errorMessage: message);
  }

  final bool isSuccess;
  final List<RoomServiceSession> sessions;
  final String? errorMessage;
}
