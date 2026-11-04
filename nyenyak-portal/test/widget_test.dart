import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:nyenyak_portal/core/config/api_config.dart';
import 'package:nyenyak_portal/features/auth/controllers/login_controller.dart';
import 'package:nyenyak_portal/features/auth/repositories/auth_repository.dart';
import 'package:nyenyak_portal/features/auth/services/auth_service.dart';
import 'package:nyenyak_portal/features/rooms/controllers/room_list_controller.dart';
import 'package:nyenyak_portal/features/rooms/repositories/room_repository.dart';
import 'package:nyenyak_portal/features/rooms/services/room_notification_sound_service.dart';
import 'package:nyenyak_portal/features/rooms/services/room_service.dart';
import 'package:nyenyak_portal/features/rooms/services/room_socket_service.dart';
import 'package:nyenyak_portal/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

http.Client _createDefaultMockClient({
  void Function(Uri uri)? onRequest,
  List<Map<String, dynamic>> Function()? room101SessionsBuilder,
}) {
  return MockClient((request) async {
    onRequest?.call(request.url);

    if (request.url.path == '/api/portal/auth/login' &&
        request.method == 'POST') {
      final body = jsonDecode(request.body) as Map<String, dynamic>;
      final email = body['email'] as String?;
      final password = body['password'] as String?;

      if (email == 'admin@nyenyak.com' && password == 'secret123') {
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {
              'id': 'usr_admin_1',
              'name': 'Admin Pusat',
              'email': 'admin@nyenyak.com',
              'role': 'Super Admin',
              'branch': {
                'id': 'br_juanda',
                'name': 'Nyenyak Juanda',
                'subdomain': 'juanda',
              },
              'authenticatedAt': '2026-10-28T12:00:00.000Z',
            },
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }

      return http.Response(
        jsonEncode({'error': 'Kata sandi yang Anda masukkan salah.'}),
        401,
        headers: {'content-type': 'application/json'},
      );
    }

    if (request.url.path == '/api/portal/rooms' && request.method == 'GET') {
      final branchId = request.url.queryParameters['branchId'];
      if (branchId == 'br_juanda') {
        return http.Response(
          jsonEncode({
            'success': true,
            'data': [
              {
                'id': 'rm_101',
                'name': 'Kamar 101',
                'capacity': 2,
                'isVip': false,
                'isActive': true,
                'branchId': 'br_juanda',
              },
              {
                'id': 'rm_vip_1',
                'name': 'Suite VIP 1',
                'capacity': 4,
                'isVip': true,
                'isActive': true,
                'branchId': 'br_juanda',
              },
            ],
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
    }

    if (request.url.path == '/api/portal/rooms/rm_101/sessions' &&
        request.method == 'GET') {
      final sessions = room101SessionsBuilder?.call() ??
          <Map<String, dynamic>>[
            {
              'id': 'sess_1',
              'roomId': 'rm_101',
              'branchId': 'br_juanda',
              'serviceId': 'srv_1',
              'itemName': 'Traditional Balinese Massage 90m',
              'customerName': 'Budi Santoso',
              'staffName': 'Siti Aminah',
              'status': 'IN_PROGRESS',
              'isVip': false,
              'isBooking': false,
              'startTime': '2026-10-28T10:00:00.000Z',
              'endTime': '2026-10-28T11:30:00.000Z',
            },
          ];

      return http.Response(
        jsonEncode({
          'success': true,
          'data': sessions,
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    return http.Response(jsonEncode({'error': 'Not found'}), 404);
  });
}

({
  LoginController loginController,
  RoomListController roomListController,
  FakeRoomSocketClient socketClient,
  FakeNotificationSoundPlayer soundPlayer,
}) _createTestControllers({http.Client? httpClient}) {
  final client = httpClient ?? _createDefaultMockClient();
  final socketClient = FakeRoomSocketClient();
  final soundPlayer = FakeNotificationSoundPlayer();

  final loginController = LoginController(
    authService: AuthService(
      PortalAuthRepository(
        httpClient: client,
        baseUrl: 'http://localhost:3000',
      ),
    ),
  );

  final roomListController = RoomListController(
    roomService: RoomService(
      PortalRoomRepository(
        httpClient: client,
        baseUrl: 'http://localhost:3000',
      ),
    ),
    socketClient: socketClient,
    soundPlayer: soundPlayer,
  );

  return (
    loginController: loginController,
    roomListController: roomListController,
    socketClient: socketClient,
    soundPlayer: soundPlayer,
  );
}

void main() {
  testWidgets('renders Nyenyak Portal login page and validates empty inputs', (
    WidgetTester tester,
  ) async {
    final controllers = _createTestControllers();
    await tester.pumpWidget(
      NyenyakPortalApp(
        loginController: controllers.loginController,
        roomListController: controllers.roomListController,
      ),
    );

    expect(find.byKey(const Key('login_email_input')), findsOneWidget);
    expect(find.byKey(const Key('login_password_input')), findsOneWidget);
    expect(find.byKey(const Key('login_submit_button')), findsOneWidget);

    await tester.tap(find.byKey(const Key('login_submit_button')));
    await tester.pump();

    expect(
      find.text('Harap masukkan alamat email yang valid.'),
      findsOneWidget,
    );
    expect(find.text('Kata sandi wajib diisi.'), findsOneWidget);
  });

  testWidgets('toggles password visibility and theme mode', (
    WidgetTester tester,
  ) async {
    final controllers = _createTestControllers();
    await tester.pumpWidget(
      NyenyakPortalApp(
        loginController: controllers.loginController,
        roomListController: controllers.roomListController,
      ),
    );

    expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);
    await tester.tap(find.byKey(const Key('login_password_visibility_button')));
    await tester.pump();
    expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);

    expect(find.byIcon(Icons.dark_mode_outlined), findsOneWidget);
    await tester.tap(find.byKey(const Key('theme_toggle_button')));
    await tester.pump();
    expect(find.byIcon(Icons.light_mode_outlined), findsOneWidget);
  });

  testWidgets(
    'logs in, binds branch to session, loads rooms for that branch, and supports sign out',
    (WidgetTester tester) async {
      final requestedUris = <Uri>[];
      final controllers = _createTestControllers(
        httpClient: _createDefaultMockClient(onRequest: requestedUris.add),
      );

      await tester.pumpWidget(
        NyenyakPortalApp(
          loginController: controllers.loginController,
          roomListController: controllers.roomListController,
        ),
      );

      await tester.enterText(
        find.byKey(const Key('login_email_input')),
        'admin@nyenyak.com',
      );
      await tester.enterText(
        find.byKey(const Key('login_password_input')),
        'secret123',
      );

      await tester.tap(find.byKey(const Key('login_submit_button')));
      await tester.pumpAndSettle();

      expect(
        requestedUris.map((u) => u.toString()),
        containsAll(<String>[
          'http://localhost:3000/api/portal/auth/login',
          'http://localhost:3000/api/portal/rooms?branchId=br_juanda',
        ]),
      );
      expect(controllers.loginController.activeBranch?.id, 'br_juanda');
      expect(
        find.byKey(const Key('authenticated_session_card')),
        findsOneWidget,
      );
      expect(find.text('Nyenyak Juanda'), findsOneWidget);
      expect(find.text('Pilih Ruangan Perangkat'), findsOneWidget);
      expect(find.text('Kamar 101'), findsOneWidget);
      expect(find.text('Suite VIP 1'), findsOneWidget);
      expect(find.text('VIP'), findsOneWidget);

      await tester.tap(find.byKey(const Key('logout_button')));
      await tester.pumpAndSettle();

      expect(controllers.loginController.activeBranch, isNull);
      expect(controllers.roomListController.rooms, isEmpty);
      expect(find.byKey(const Key('login_submit_button')), findsOneWidget);
    },
  );

  testWidgets(
    'selects a room card, displays arranged sessions, and live-updates on WebSocket event',
    (WidgetTester tester) async {
      var sessionCount = 1;
      final controllers = _createTestControllers(
        httpClient: _createDefaultMockClient(
          room101SessionsBuilder: () {
            final items = <Map<String, dynamic>>[
              {
                'id': 'sess_done_1',
                'roomId': 'rm_101',
                'branchId': 'br_juanda',
                'serviceId': 'srv_0',
                'itemName': 'Hot Stone Therapy 90m',
                'customerName': 'Andi Wijaya',
                'staffName': 'Siti Aminah',
                'status': 'COMPLETED',
                'isVip': false,
                'isBooking': false,
                'startTime': '2026-10-28T08:00:00.000Z',
                'endTime': '2026-10-28T09:30:00.000Z',
              },
              {
                'id': 'sess_1',
                'roomId': 'rm_101',
                'branchId': 'br_juanda',
                'serviceId': 'srv_1',
                'itemName': 'Traditional Balinese Massage 90m',
                'customerName': 'Budi Santoso',
                'staffName': 'Siti Aminah',
                'status': 'IN_PROGRESS',
                'isVip': false,
                'isBooking': false,
                'startTime': '2026-10-28T10:00:00.000Z',
                'endTime': '2026-10-28T11:30:00.000Z',
              },
            ];
            if (sessionCount > 1) {
              items.add({
                'id': 'sess_2',
                'roomId': 'rm_101',
                'branchId': 'br_juanda',
                'serviceId': 'srv_2',
                'itemName': 'Aromatherapy Reflexology 60m',
                'customerName': 'Dewi Lestari',
                'staffName': 'Rina Wati',
                'status': 'SCHEDULED',
                'isVip': false,
                'isBooking': true,
                'startTime': '2026-10-28T13:00:00.000Z',
                'endTime': '2026-10-28T14:00:00.000Z',
              });
            }
            return items;
          },
        ),
      );

      await tester.pumpWidget(
        NyenyakPortalApp(
          loginController: controllers.loginController,
          roomListController: controllers.roomListController,
        ),
      );

      await tester.enterText(
        find.byKey(const Key('login_email_input')),
        'admin@nyenyak.com',
      );
      await tester.enterText(
        find.byKey(const Key('login_password_input')),
        'secret123',
      );
      await tester.tap(find.byKey(const Key('login_submit_button')));
      await tester.pumpAndSettle();

      // Tap Kamar 101 card to bind the device to that room
      await tester.tap(find.byKey(const Key('room_card_rm_101')));
      await tester.pumpAndSettle();

      expect(
        find.byKey(const Key('selected_room_view_rm_101')),
        findsOneWidget,
      );
      expect(find.byKey(const Key('room_sessions_grid')), findsOneWidget);
      expect(find.text('Sinkronisasi langsung'), findsOneWidget);
      expect(find.text('Jadwal Sesi Hari Ini'), findsOneWidget);
      expect(find.text('Traditional Balinese Massage 90m'), findsOneWidget);
      expect(
        find.text('Tamu: Budi Santoso · Terapis: Siti Aminah'),
        findsOneWidget,
      );
      expect(find.text('Sedang Berlangsung'), findsOneWidget);
      // Completed sessions are hidden from the main schedule view
      expect(find.text('Hot Stone Therapy 90m'), findsNothing);

      // Open the History Drawer to inspect completed sessions
      await tester.tap(find.byKey(const Key('room_history_button')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('room_history_drawer')), findsOneWidget);
      expect(find.text('Riwayat Sesi Selesai'), findsOneWidget);
      expect(find.text('Hot Stone Therapy 90m'), findsOneWidget);

      await tester.tap(find.byKey(const Key('close_history_drawer_button')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('room_history_drawer')), findsNothing);

      // Simulate a new session assigned in POS broadcasting over WebSocket
      expect(controllers.soundPlayer.playCount, 0);
      sessionCount = 2;
      controllers.socketClient.simulateRoomEvent();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 250));

      // Verify notification sound played, toast banner appeared, and 10s new-service badge is active
      expect(controllers.soundPlayer.playCount, 1);
      expect(find.byKey(const Key('new_service_toast_banner')), findsOneWidget);
      expect(find.text('Layanan Baru Ditugaskan'), findsOneWidget);
      expect(find.byKey(const Key('new_session_badge_sess_2')), findsOneWidget);

      expect(find.text('Aromatherapy Reflexology 60m'), findsOneWidget);
      expect(
        find.text('Tamu: Dewi Lestari · Terapis: Rina Wati'),
        findsOneWidget,
      );
      expect(find.text('Terjadwal'), findsOneWidget);

      // Advance 5 seconds: new-service highlight is halfway faded but still active
      await tester.pump(const Duration(seconds: 5));
      expect(find.byKey(const Key('new_session_badge_sess_2')), findsOneWidget);

      // Advance past the 10-second window: toast and special card highlight fade out completely
      await tester.pump(const Duration(seconds: 6));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('new_service_toast_banner')), findsNothing);
      expect(find.byKey(const Key('new_session_badge_sess_2')), findsNothing);

      // Search by therapist name ('Rina') filters down to Rina Wati's session
      await tester.enterText(
        find.byKey(const Key('room_sessions_search_input')),
        'Rina',
      );
      await tester.pumpAndSettle();

      expect(find.text('Aromatherapy Reflexology 60m'), findsOneWidget);
      expect(find.text('Traditional Balinese Massage 90m'), findsNothing);

      // Clear search to restore all ongoing & scheduled sessions
      await tester.tap(
        find.byKey(const Key('clear_room_sessions_search_button')),
      );
      await tester.pumpAndSettle();

      expect(find.text('Traditional Balinese Massage 90m'), findsOneWidget);
      expect(find.text('Aromatherapy Reflexology 60m'), findsOneWidget);

      // System back button returns to room selection instead of exiting app
      final NavigatorState navigator = tester.state(find.byType(Navigator));
      await navigator.maybePop();
      await tester.pumpAndSettle();

      expect(find.text('Pilih Ruangan Perangkat'), findsOneWidget);
      expect(controllers.roomListController.selectedRoom, isNull);

      // Re-select room and verify 'Ganti Ruangan' button also unbinds room
      await tester.tap(find.byKey(const Key('room_card_rm_101')));
      await tester.pumpAndSettle();
      expect(
        find.byKey(const Key('selected_room_view_rm_101')),
        findsOneWidget,
      );

      await tester.tap(find.byKey(const Key('change_room_button')));
      await tester.pumpAndSettle();

      expect(find.text('Pilih Ruangan Perangkat'), findsOneWidget);
    },
  );

  testWidgets('surfaces server error message on 401 unauthorized response', (
    WidgetTester tester,
  ) async {
    final controllers = _createTestControllers();
    await tester.pumpWidget(
      NyenyakPortalApp(
        loginController: controllers.loginController,
        roomListController: controllers.roomListController,
      ),
    );

    await tester.enterText(
      find.byKey(const Key('login_email_input')),
      'admin@nyenyak.com',
    );
    await tester.enterText(
      find.byKey(const Key('login_password_input')),
      'wrongpass',
    );

    await tester.tap(find.byKey(const Key('login_submit_button')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('login_error_banner')), findsOneWidget);
    expect(
      find.text('Kata sandi yang Anda masukkan salah.'),
      findsOneWidget,
    );
  });

  test('ApiConfig resolves NYENYAK_API_BASE_URL and NYENYAK_SOCKET_URL from flutter_dotenv', () {
    dotenv.loadFromString(
      envString: '''
NYENYAK_API_BASE_URL=https://api.nyenyak.com/
NYENYAK_SOCKET_URL=https://socket.nyenyak.com/
''',
    );

    expect(ApiConfig.baseUrl, 'https://api.nyenyak.com');
    expect(ApiConfig.socketUrl, 'https://socket.nyenyak.com');
    expect(
      ApiConfig.resolve(ApiConfig.portalLoginPath).toString(),
      'https://api.nyenyak.com/api/portal/auth/login',
    );

    dotenv.clean();
    expect(ApiConfig.baseUrl, 'http://localhost:3000');
    expect(ApiConfig.socketUrl, 'http://localhost:3001');
  });

  test('persists AuthSession and selected PortalRoom across app restarts until signOut', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    final firstRun = _createTestControllers();
    final loggedIn = await firstRun.loginController.submit(
      email: 'admin@nyenyak.com',
      password: 'secret123',
    );
    expect(loggedIn, isTrue);

    await firstRun.roomListController.loadRooms('br_juanda');
    final room101 = firstRun.roomListController.rooms.first;
    await firstRun.roomListController.selectRoom(room101);

    // Simulate cold app restart with brand-new controllers reading SharedPreferences
    final secondRun = _createTestControllers();
    final restoredSession = await secondRun.loginController.restoreSession();
    expect(restoredSession, isNotNull);
    expect(restoredSession!.email, 'admin@nyenyak.com');
    expect(restoredSession.branchId, 'br_juanda');

    final restoredRoom = await secondRun.roomListController.restoreSelectedRoom(
      restoredSession.branchId,
    );
    expect(restoredRoom, isNotNull);
    expect(restoredRoom!.id, 'rm_101');
    expect(secondRun.roomListController.roomSessions, isNotEmpty);

    // Sign out clears persisted session and room
    secondRun.roomListController.clear();
    await secondRun.loginController.signOut();

    final thirdRun = _createTestControllers();
    expect(await thirdRun.loginController.restoreSession(), isNull);
    expect(
      await thirdRun.roomListController.restoreSelectedRoom('br_juanda'),
      isNull,
    );
  });
}
