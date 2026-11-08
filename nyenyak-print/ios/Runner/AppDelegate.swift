import Flutter
import UIKit
import UserNotifications

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private let channelName = "com.okgo.nyenyak.print/foreground_service"
  private let notificationId = "nyenyak_print_server_status"

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    UNUserNotificationCenter.current().delegate = self
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)

    let messenger = engineBridge.applicationRegistrar.messenger()
    let channel = FlutterMethodChannel(name: channelName, binaryMessenger: messenger)

    channel.setMethodCallHandler { [weak self] call, result in
      guard let self = self else {
        result(false)
        return
      }
      switch call.method {
      case "areNotificationsEnabled":
        UNUserNotificationCenter.current().getNotificationSettings { settings in
          let enabled = settings.authorizationStatus == .authorized ||
                        settings.authorizationStatus == .provisional
          DispatchQueue.main.async {
            result(enabled)
          }
        }
      case "startOrUpdate":
        let args = call.arguments as? [String: Any]
        let title = args?["title"] as? String ?? "Nyenyak Print Server Aktif"
        let body = args?["body"] as? String ?? "Server lokal berjalan di http://127.0.0.1:9123"
        self.postStatusNotification(title: title, body: body, completion: result)
      case "stop":
        UNUserNotificationCenter.current().removeDeliveredNotifications(
          withIdentifiers: [self.notificationId]
        )
        result(true)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }

  private func postStatusNotification(
    title: String,
    body: String,
    completion: @escaping FlutterResult
  ) {
    let center = UNUserNotificationCenter.current()
    center.requestAuthorization(options: [.alert, .badge]) { granted, _ in
      guard granted else {
        DispatchQueue.main.async {
          completion(false)
        }
        return
      }
      let content = UNMutableNotificationContent()
      content.title = title
      content.body = body
      if #available(iOS 15.0, *) {
        content.interruptionLevel = .active
      }

      let request = UNNotificationRequest(
        identifier: self.notificationId,
        content: content,
        trigger: nil
      )
      center.add(request) { _ in
        DispatchQueue.main.async {
          completion(true)
        }
      }
    }
  }

  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    if #available(iOS 14.0, *) {
      completionHandler([.banner, .list])
    } else {
      completionHandler([.alert])
    }
  }
}
