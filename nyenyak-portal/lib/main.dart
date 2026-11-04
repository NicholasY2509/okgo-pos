import 'package:flutter/material.dart';
import 'core/config/api_config.dart';
import 'core/theme/nyenyak_theme.dart';
import 'features/auth/controllers/login_controller.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/auth/repositories/auth_repository.dart';
import 'features/auth/services/auth_service.dart';
import 'features/liveness/controllers/staff_face_controller.dart';
import 'features/rooms/controllers/room_list_controller.dart';
import 'features/rooms/repositories/room_repository.dart';
import 'features/rooms/services/room_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConfig.loadEnv();

  final authRepository = PortalAuthRepository();
  final authService = AuthService(authRepository);
  final loginController = LoginController(authService: authService);

  final roomRepository = PortalRoomRepository();
  final roomService = RoomService(roomRepository);
  final roomListController = RoomListController(roomService: roomService);
  final staffFaceController = StaffFaceController();

  final restoredSession = await loginController.restoreSession();
  if (restoredSession != null) {
    await roomListController.restoreSelectedRoom(restoredSession.branchId);
    staffFaceController.loadProfiles(restoredSession.branchId);
  }

  runApp(
    NyenyakPortalApp(
      loginController: loginController,
      roomListController: roomListController,
      staffFaceController: staffFaceController,
    ),
  );
}

class NyenyakPortalApp extends StatefulWidget {
  const NyenyakPortalApp({
    super.key,
    required this.loginController,
    this.roomListController,
    this.staffFaceController,
  });

  final LoginController loginController;
  final RoomListController? roomListController;
  final StaffFaceController? staffFaceController;

  @override
  State<NyenyakPortalApp> createState() => _NyenyakPortalAppState();
}

class _NyenyakPortalAppState extends State<NyenyakPortalApp> {
  ThemeMode _themeMode = ThemeMode.light;
  late final RoomListController _fallbackRoomController = RoomListController(
    roomService: RoomService(PortalRoomRepository()),
  );
  StaffFaceController? _fallbackFaceController;

  RoomListController get _effectiveRoomController =>
      widget.roomListController ?? _fallbackRoomController;

  StaffFaceController get _effectiveFaceController =>
      widget.staffFaceController ??
      (_fallbackFaceController ??= StaffFaceController());

  void _toggleThemeMode() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.dark
          ? ThemeMode.light
          : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nyenyak Portal',
      debugShowCheckedModeBanner: false,
      theme: NyenyakTheme.light(),
      darkTheme: NyenyakTheme.dark(),
      themeMode: _themeMode,
      home: LoginPage(
        controller: widget.loginController,
        roomListController: _effectiveRoomController,
        staffFaceController: _effectiveFaceController,
        themeMode: _themeMode,
        onToggleTheme: _toggleThemeMode,
      ),
    );
  }
}
