"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle2,
  Copy,
  DownloadCloud,
  Key,
  Radio,
  RefreshCw,
  Server,
  UserCheck,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { useFingerspot, type MachineOption } from "../hooks/use-fingerspot"

interface FingerspotDashboardProps {
  machines: MachineOption[]
  defaultWebhookUrl: string
}

export function FingerspotDashboard({
  machines,
  defaultWebhookUrl,
}: FingerspotDashboardProps) {
  const {
    apiToken,
    saveApiToken,
    cloudId,
    setCloudId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    userPin,
    setUserPin,
    isCheckingDevice,
    isPullingAttlog,
    isRequestingUsers,
    isRequestingUserInfo,
    isLoadingLogs,
    deviceResult,
    attlogResults,
    syncSummary,
    asyncCommandStatus,
    recentLogs,
    autoRefresh,
    setAutoRefresh,
    handleCheckDevice,
    handlePullAttlog,
    handleRequestUserIdList,
    handleRequestUserInfo,
    refreshRecentLogs,
  } = useFingerspot(machines)

  const [inputToken, setInputToken] = useState("")
  const [showTokenInput, setShowTokenInput] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Berhasil disalin ke clipboard.")
  }

  const selectedMachine = machines.find((m) => m.sn === cloudId)

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner: Connection Settings & Webhook helper */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Konfigurasi Fingerspot Cloud
              </CardTitle>
              <CardDescription>
                Pilih mesin dan atur Bearer Token API untuk berkomunikasi dengan server developer.fingerspot.io
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="gap-2"
              >
                <Key className="h-4 w-4" />
                {apiToken ? "Ubah API Token" : "Masukkan API Token"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showTokenInput && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="token-input">Bearer Token dari developer.fingerspot.io</Label>
                <Input
                  id="token-input"
                  type="password"
                  placeholder="Tempel API Token di sini..."
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  if (inputToken.trim()) {
                    saveApiToken(inputToken.trim())
                    setShowTokenInput(false)
                    setInputToken("")
                  } else {
                    toast.error("Token tidak boleh kosong.")
                  }
                }}
              >
                Simpan Token
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Machine Selector */}
            <div className="space-y-1.5">
              <Label>Pilih Mesin / Cloud ID</Label>
              <div className="flex gap-2">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={cloudId}
                  onChange={(e) => setCloudId(e.target.value)}
                >
                  {machines.length === 0 ? (
                    <option value="S118001804">S118001804 (Default Vida W-2411M)</option>
                  ) : (
                    machines.map((m) => (
                      <option key={m.id} value={m.sn}>
                        {m.name} ({m.sn}) - {m.branch?.name || "Semua Cabang"}
                      </option>
                    ))
                  )}
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCheckDevice}
                  disabled={isCheckingDevice}
                  className="whitespace-nowrap"
                >
                  {isCheckingDevice ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Radio className="h-4 w-4 mr-1" />
                  )}
                  Cek Status
                </Button>
              </div>
              {selectedMachine && (
                <p className="text-xs text-muted-foreground">
                  Cabang: {selectedMachine.branch?.name || "-"} | SN: {selectedMachine.sn}
                </p>
              )}
            </div>

            {/* Webhook Endpoint Info */}
            <div className="space-y-1.5">
              <Label>URL Webhook Aplikasi Anda</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={defaultWebhookUrl}
                  className="bg-muted font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyToClipboard(defaultWebhookUrl)}
                  title="Salin URL Webhook"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Pastikan URL ini sudah terdaftar di kolom "End Point Webhook" pada dashboard developer.fingerspot.io
              </p>
            </div>
          </div>

          {/* Device Check Result Banner */}
          {deviceResult && (
            <div className="p-3 bg-primary/5 rounded-md border border-primary/20 text-sm">
              <div className="flex items-center gap-2 font-medium text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Respon Informasi Perangkat dari Fingerspot:
              </div>
              <pre className="mt-2 text-xs bg-muted/60 p-2 rounded overflow-x-auto">
                {JSON.stringify(deviceResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs: Live Punches, Pull Logs, Pull Users */}
      <Tabs defaultValue="live-punches" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full sm:w-[480px]">
          <TabsTrigger value="live-punches">Live Punch Mesin</TabsTrigger>
          <TabsTrigger value="pull-logs">Tarik Log Cloud</TabsTrigger>
          <TabsTrigger value="pull-users">Data User Mesin</TabsTrigger>
        </TabsList>

        {/* Tab 1: Live Punch Log Monitor */}
        <TabsContent value="live-punches" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  Riwayat Punch Absensi Terkini
                  {autoRefresh && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-normal bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live (3s)
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Data punch yang diterima dari mesin Fingerspot via webhook secara realtime.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto-refresh-switch"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <Label htmlFor="auto-refresh-switch" className="text-xs cursor-pointer">
                    Auto-Refresh
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshRecentLogs}
                  disabled={isLoadingLogs}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingLogs ? "animate-spin" : ""}`} />
                  Segarkan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Belum ada log punch yang masuk dari mesin. Coba lakukan scan wajah/jari pada mesin untuk menguji webhook.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu Scan</TableHead>
                        <TableHead>Karyawan</TableHead>
                        <TableHead>PIN Mesin</TableHead>
                        <TableHead>Tipe Absen</TableHead>
                        <TableHead>Metode / Info</TableHead>
                        <TableHead>Mesin (SN)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentLogs.map((log) => {
                        const dateFormatted = log.utcTime
                          ? new Date(log.utcTime).toLocaleString("id-ID")
                          : new Date(log.createdAt).toLocaleString("id-ID")

                        const isClockIn = log.attendanceState === 1 || log.punchType === "Masuk"
                        const isClockOut = log.attendanceState === 4 || log.punchType === "Pulang"

                        return (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs whitespace-nowrap">
                              {dateFormatted}
                            </TableCell>
                            <TableCell>
                              {log.staff ? (
                                <span className="font-medium">
                                  {log.staff.firstName} {log.staff.lastName || ""}
                                </span>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Belum Dipetakan
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.machineUserId || "-"}
                            </TableCell>
                            <TableCell>
                              {isClockIn ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700">Masuk</Badge>
                              ) : isClockOut ? (
                                <Badge className="bg-blue-600 hover:bg-blue-700">Pulang</Badge>
                              ) : (
                                <Badge variant="outline">{log.punchType || `Status ${log.attendanceState}`}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {log.cardName || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {log.deviceSn || "-"}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Pull Logs via API (get_attlog) */}
        <TabsContent value="pull-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DownloadCloud className="h-5 w-5 text-primary" />
                Tarik Riwayat Log Absensi dari Cloud
              </CardTitle>
              <CardDescription>
                Mengambil data log absensi yang tersimpan di cloud Fingerspot via API <code>/api/get_attlog</code> (maksimal rentang 2 hari per tarikan).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="start-date">Tanggal Awal</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end-date">Tanggal Akhir</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div>
                  <Button
                    onClick={() => handlePullAttlog(true)}
                    disabled={isPullingAttlog}
                    className="w-full gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isPullingAttlog ? "animate-spin" : ""}`} />
                    {isPullingAttlog ? "Menarik Data..." : "Tarik Data & Simpan"}
                  </Button>
                </div>
              </div>

              {syncSummary && (
                <div className="p-3 bg-muted rounded-md text-sm flex items-center justify-between">
                  <span>Hasil sinkronisasi:</span>
                  <div className="flex gap-2">
                    <Badge variant="default">{syncSummary.imported} Baru Disimpan</Badge>
                    <Badge variant="outline">{syncSummary.skipped} Sudah Ada</Badge>
                  </div>
                </div>
              )}

              {attlogResults.length > 0 && (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>PIN Mesin</TableHead>
                        <TableHead>Tanggal & Waktu Scan</TableHead>
                        <TableHead>Metode Verifikasi</TableHead>
                        <TableHead>Status Scan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attlogResults.map((item, idx) => {
                        const scanTime = item.time || item.scan_date || "-"
                        const verifCode = Number(item.verif ?? item.verify ?? 0)
                        const statusCode = Number(item.status ?? item.status_scan ?? 0)

                        return (
                          <TableRow key={idx}>
                            <TableCell className="text-xs">{idx + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{item.pin}</TableCell>
                            <TableCell className="font-mono text-xs">{scanTime}</TableCell>
                            <TableCell className="text-xs">
                              {verifCode === 1
                                ? "Sidik Jari"
                                : verifCode === 4
                                ? "Wajah"
                                : verifCode === 3
                                ? "Kartu RFID"
                                : `Kode ${verifCode}`}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusCode === 0 ? "default" : "secondary"}>
                                {statusCode === 0
                                  ? "Masuk"
                                  : statusCode === 1
                                  ? "Pulang"
                                  : `Status ${statusCode}`}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Pull User Data from Machine (get_userid_list & get_userinfo) */}
        <TabsContent value="pull-users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Tarik Data Karyawan dari Mesin
              </CardTitle>
              <CardDescription>
                Meminta daftar PIN dan kredensial template biometrik yang tersimpan di mesin absensi. Operasi ini berjalan asinkron (hasil dikirimkan mesin ke Webhook Anda).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Request 1: Get User ID List */}
              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      1. Tarik Semua Daftar PIN dari Mesin
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mesin akan membalas dengan daftar semua User PIN yang sudah terdaftar di dalamnya.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestUserIdList}
                    disabled={isRequestingUsers}
                    className="gap-2 shrink-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRequestingUsers ? "animate-spin" : ""}`} />
                    Minta Daftar PIN
                  </Button>
                </div>
              </div>

              {/* Request 2: Get Specific User Info */}
              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  2. Tarik Detail & Template User Tertentu
                </h4>
                <p className="text-xs text-muted-foreground">
                  Masukkan PIN pengguna pada mesin untuk menarik detail profil, nama, dan string template biometrik.
                </p>
                <div className="flex items-end gap-3 max-w-sm">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="pin-input">PIN Mesin Karyawan</Label>
                    <Input
                      id="pin-input"
                      value={userPin}
                      onChange={(e) => setUserPin(e.target.value)}
                      placeholder="Contoh: 1"
                    />
                  </div>
                  <Button
                    onClick={handleRequestUserInfo}
                    disabled={isRequestingUserInfo}
                    className="gap-2 shrink-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRequestingUserInfo ? "animate-spin" : ""}`} />
                    Minta Info PIN {userPin}
                  </Button>
                </div>
              </div>

              {/* Async Command Status Banner */}
              {asyncCommandStatus && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-md text-xs text-blue-900 dark:text-blue-200">
                  {asyncCommandStatus}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

