"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  getBranchWhatsappConfigAction,
  createWhatsappInstanceAction,
  linkBranchWhatsappAction,
} from "@/modules/whatsapp/actions/whatsapp-pairing-action";
import { useWhatsappPairing } from "@/modules/whatsapp/hooks/use-whatsapp-pairing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  QrCode,
  Smartphone,
  Send,
  LogOut,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  Copy,
  Check,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

interface BranchWhatsappTabProps {
  branchId: string;
  branchName: string;
  subdomain: string;
}

export function BranchWhatsappTab({ branchId, branchName, subdomain }: BranchWhatsappTabProps) {
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configuredInstance, setConfiguredInstance] = useState<string | null>(null);
  const [allInstances, setAllInstances] = useState<string[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [isSavingInstance, setIsSavingInstance] = useState(false);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showChangeInstance, setShowChangeInstance] = useState(false);

  const activeInstance = configuredInstance || "";
  const suggestedName = `nyenyak-${subdomain.toLowerCase()}`;
  const doesSuggestedExist = allInstances.some(
    (inst) => inst.toLowerCase() === suggestedName.toLowerCase()
  );

  const {
    status,
    isLoadingStatus,
    isConnecting,
    isLoggingOut,
    isSendingTest,
    qrCodeData,
    phoneNumberInput,
    setPhoneNumberInput,
    testPhone,
    setTestPhone,
    testMessage,
    setTestMessage,
    handleConnect,
    handleLogout,
    handleRestart,
    handleSendTestMessage,
    refreshStatus,
  } = useWhatsappPairing(undefined, activeInstance || undefined);

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await getBranchWhatsappConfigAction(branchId);
      if (res.success && res.data) {
        setConfiguredInstance(res.data.configuredInstanceName || null);
        setSelectedInstance(res.data.configuredInstanceName || "");
        setAllInstances(res.data.allInstances || []);
      }
    } catch {
      toast.error("Gagal memuat konfigurasi WhatsApp cabang.");
    } finally {
      setLoadingConfig(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSaveInstance = async (newInstanceName: string | null) => {
    setIsSavingInstance(true);
    try {
      const res = await linkBranchWhatsappAction({
        branchId,
        instanceName: newInstanceName || null,
      });
      if (res.success) {
        toast.success(
          newInstanceName
            ? `Cabang berhasil dihubungkan ke instance ${newInstanceName}.`
            : "Hubungan instance WhatsApp berhasil dilepas."
        );
        setConfiguredInstance(newInstanceName);
        setSelectedInstance(newInstanceName || "");
      } else {
        toast.error(res.error || "Gagal menghubungkan instance.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan pengaturan.");
    } finally {
      setIsSavingInstance(false);
    }
  };

  const handleCreateBranchInstance = async () => {
    const suggestedName = `nyenyak-${subdomain.toLowerCase()}`;
    setIsCreatingInstance(true);
    try {
      const res = await createWhatsappInstanceAction({
        instanceName: suggestedName,
        branchId,
      });

      if (res.success) {
        toast.success(`Instance ${suggestedName} berhasil dibuat untuk ${branchName}!`);
        await loadConfig();
      } else {
        toast.error(res.error || "Gagal membuat instance baru.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat membuat instance.");
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const handleCopyPairingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isConnected = status?.connected ?? false;

  return (
    <div className="space-y-6">
      {/* 1. Header & Current Status */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Integrasi WhatsApp Cabang: {branchName}
              </CardTitle>
              <CardDescription>
                Hubungkan nomor WhatsApp resmi khusus cabang ini agar struk digital dikirim dari nomor cabang.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refreshStatus();
                  loadConfig();
                }}
                disabled={isLoadingStatus || loadingConfig}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingStatus ? "animate-spin" : ""}`} />
                Segarkan
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Instance WhatsApp Aktif</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-foreground">
                  {configuredInstance || "(Belum Dikonfigurasi)"}
                </span>
                {configuredInstance ? (
                  isConnected ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      Terhubung
                    </Badge>
                  ) : status?.state === "connecting" ? (
                    <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 gap-1 text-xs">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Menghubungkan
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <XCircle className="w-3 h-3" />
                      Terputus
                    </Badge>
                  )
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Nonaktif
                  </Badge>
                )}
              </div>
            </div>

            {configuredInstance && isConnected && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Nomor WhatsApp Terhubung</div>
                <div className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                  +{status?.owner || "-"}
                </div>
              </div>
            )}
          </div>

          {/* Instance Selection & Creation Form */}
          {configuredInstance ? (
            <div className="p-4 rounded-xl border bg-card space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Instance WhatsApp:</span>
                  <span className="font-mono font-bold text-foreground text-sm">{configuredInstance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setShowChangeInstance(!showChangeInstance)}
                  >
                    {showChangeInstance ? "Batal Ubah" : "Ganti Instance"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => handleSaveInstance(null)}
                    disabled={isSavingInstance}
                  >
                    Lepas Tautan
                  </Button>
                </div>
              </div>

              {showChangeInstance && (
                <div className="pt-3 border-t space-y-2">
                  <Label className="text-xs text-muted-foreground">Pilih instance lain untuk ditautkan ke cabang ini</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedInstance}
                      onValueChange={(val) => setSelectedInstance(val)}
                      disabled={isSavingInstance}
                    >
                      <SelectTrigger className="font-mono text-xs">
                        <SelectValue placeholder="Pilih instance Evolution API" />
                      </SelectTrigger>
                      <SelectContent>
                        {allInstances.map((inst) => (
                          <SelectItem key={inst} value={inst} className="font-mono text-xs">
                            {inst}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleSaveInstance(selectedInstance);
                        setShowChangeInstance(false);
                      }}
                      disabled={isSavingInstance || !selectedInstance || selectedInstance === configuredInstance}
                    >
                      <LinkIcon className="w-3.5 h-3.5 mr-1" />
                      Simpan
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border bg-card space-y-4">
              <div className="text-sm font-semibold text-foreground">Hubungkan Instance WhatsApp</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pilih dari Instance yang Ada</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedInstance}
                      onValueChange={(val) => setSelectedInstance(val)}
                      disabled={isSavingInstance}
                    >
                      <SelectTrigger className="font-mono text-xs">
                        <SelectValue placeholder="Pilih instance Evolution API" />
                      </SelectTrigger>
                      <SelectContent>
                        {allInstances.map((inst) => (
                          <SelectItem key={inst} value={inst} className="font-mono text-xs">
                            {inst}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveInstance(selectedInstance)}
                      disabled={isSavingInstance || !selectedInstance}
                    >
                      <LinkIcon className="w-3.5 h-3.5 mr-1" />
                      Tautkan
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {doesSuggestedExist ? "Instance Khusus Tersedia" : "Buat Instance Khusus Cabang Ini"}
                  </Label>
                  <div>
                    {doesSuggestedExist ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full font-medium gap-1.5 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => handleSaveInstance(suggestedName)}
                        disabled={isSavingInstance}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Tautkan ke `{suggestedName}` (Sudah Dibuat)
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-1.5 text-xs"
                        onClick={handleCreateBranchInstance}
                        disabled={isCreatingInstance || isSavingInstance}
                      >
                        {isCreatingInstance ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Membuat Instance...
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Buat Instance `{suggestedName}`
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Pairing & Connection Operations (Active only if instance is configured) */}
      {configuredInstance && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Pairing Area */}
          <div className="lg:col-span-7">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Tautkan Perangkat WhatsApp Cabang</CardTitle>
                <CardDescription className="text-xs">
                  Buka WhatsApp di ponsel cabang $\to$ Perangkat Tertaut $\to$ Pindai QR atau masukkan kode pairing 8 digit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConnected ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="font-semibold text-base">WhatsApp Cabang Siap Digunakan</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Nomor terhubung: <span className="font-mono font-bold text-foreground">+{status?.owner || "-"}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                      onClick={() => setIsLogoutDialogOpen(true)}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1.5" />
                      Putuskan Sambungan
                    </Button>
                  </div>
                ) : (
                  <Tabs defaultValue="qr" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="qr" className="text-xs">
                        <QrCode className="w-3.5 h-3.5 mr-1.5" />
                        Scan QR Code
                      </TabsTrigger>
                      <TabsTrigger value="code" className="text-xs">
                        <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                        Kode Pairing 8 Digit
                      </TabsTrigger>
                    </TabsList>

                    {/* QR Code Tab */}
                    <TabsContent value="qr" className="space-y-4 pt-3">
                      <div className="flex flex-col items-center justify-center p-6 bg-muted/20 border rounded-xl min-h-[260px]">
                        {qrCodeData?.base64 ? (
                          <div className="space-y-3 text-center">
                            <div className="p-3 bg-white rounded-xl shadow-sm inline-block">
                              <Image
                                src={qrCodeData.base64}
                                alt="WhatsApp QR Code"
                                width={220}
                                height={220}
                                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                                unoptimized
                              />
                            </div>
                            <p className="text-xs text-muted-foreground animate-pulse">
                              Menunggu pemindaian... QR code akan me-refresh otomatis.
                            </p>
                          </div>
                        ) : (
                          <div className="text-center space-y-3">
                            <QrCode className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                            <p className="text-xs text-muted-foreground max-w-xs">
                              Klik tombol di bawah untuk menampilkan QR Code penautan WhatsApp cabang.
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleConnect()}
                              disabled={isConnecting}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            >
                              {isConnecting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                  Memuat QR Code...
                                </>
                              ) : (
                                "Tampilkan QR Code"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* 8-Digit Pairing Code Tab */}
                    <TabsContent value="code" className="space-y-4 pt-3">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Nomor Telepon Cabang</Label>
                          <div className="flex gap-2">
                            <Input
                              type="tel"
                              placeholder="08123456789 atau 628123456789"
                              value={phoneNumberInput}
                              onChange={(e) => setPhoneNumberInput(e.target.value)}
                              disabled={isConnecting}
                              className="font-mono text-xs"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleConnect(phoneNumberInput)}
                              disabled={isConnecting || !phoneNumberInput.trim()}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shrink-0"
                            >
                              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Minta Kode"}
                            </Button>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Format nomor lokal (08xx) akan otomatis dikonversi ke (628xx).
                          </p>
                        </div>

                        {qrCodeData?.pairingCode && (
                          <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-2">
                            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                              Masukkan kode berikut pada WhatsApp Anda:
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-mono text-2xl font-bold tracking-widest text-emerald-700 dark:text-emerald-400">
                                {qrCodeData.pairingCode}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyPairingCode(qrCodeData.pairingCode!)}
                                className="h-8 w-8 p-0"
                              >
                                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Test Message & Controls */}
          <div className="lg:col-span-5">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Uji Coba Pengiriman Pesan</CardTitle>
                <CardDescription className="text-xs">
                  Kirim pesan uji coba untuk memverifikasi bahwa WhatsApp cabang dapat mengirim pesan keluar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nomor Tujuan Uji Coba</Label>
                  <Input
                    type="tel"
                    placeholder="081234567890"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    disabled={isSendingTest || !isConnected}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Isi Pesan Teks</Label>
                  <Input
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    disabled={isSendingTest || !isConnected}
                    className="text-xs"
                  />
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSendTestMessage}
                  disabled={isSendingTest || !isConnected || !testPhone.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Pesan Uji Coba
                    </>
                  )}
                </Button>

                {!isConnected && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center">
                    Tautkan WhatsApp terlebih dahulu untuk melakukan uji coba.
                  </p>
                )}

                <div className="pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                  <span>Instance Control:</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleRestart}
                    disabled={isConnecting}
                  >
                    Restart Instance
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Unpair Confirmation Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Putuskan Sambungan WhatsApp Cabang?</AlertDialogTitle>
            <AlertDialogDescription>
              WhatsApp cabang `{branchName}` akan dikeluarkan dari server. Pengiriman struk otomatis dari cabang ini akan terhenti sampai ditautkan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Putuskan Sambungan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

