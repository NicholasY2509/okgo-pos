"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useWhatsappPairing } from "../hooks/use-whatsapp-pairing";
import {
  listAllWhatsappInstancesAction,
  createWhatsappInstanceAction,
  deleteWhatsappInstanceAction,
  linkBranchWhatsappAction,
} from "../actions/whatsapp-pairing-action";
import type {
  MultiInstanceDashboardData,
  BranchInstanceInfo,
} from "../services/whatsapp-pairing-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  CheckCircle2,
  XCircle,
  RefreshCw,
  QrCode,
  Smartphone,
  Send,
  LogOut,
  Loader2,
  Copy,
  Check,
  Server,
  AlertTriangle,
  Plus,
  Trash2,
  Building2,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

interface WhatsappPairingManagerProps {
  initialDashboardData?: MultiInstanceDashboardData;
}

export function WhatsappPairingManager({ initialDashboardData }: WhatsappPairingManagerProps) {
  const [dashboard, setDashboard] = useState<MultiInstanceDashboardData | null>(initialDashboardData || null);
  const [loadingDashboard, setLoadingDashboard] = useState(!initialDashboardData);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>(
    initialDashboardData?.instances[0]?.instanceName || initialDashboardData?.defaultInstanceName || "tester"
  );

  // Modal create instance state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [newBranchId, setNewBranchId] = useState<string>("none");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Delete instance state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Logout dialog
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Hook for the currently selected instance
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
  } = useWhatsappPairing(undefined, selectedInstanceName);

  const fetchDashboard = useCallback(async (quiet = false) => {
    if (!quiet) setLoadingDashboard(true);
    try {
      const res = await listAllWhatsappInstancesAction();
      if (res.success && res.data) {
        setDashboard(res.data);
        if (!selectedInstanceName && res.data.instances.length > 0) {
          setSelectedInstanceName(res.data.instances[0].instanceName);
        }
      }
    } catch {
      if (!quiet) toast.error("Gagal memuat data dashboard WhatsApp.");
    } finally {
      if (!quiet) setLoadingDashboard(false);
    }
  }, [selectedInstanceName]);

  useEffect(() => {
    if (!initialDashboardData) {
      fetchDashboard();
    }
  }, [initialDashboardData, fetchDashboard]);

  const handleCopyPairingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error("Nama instance wajib diisi.");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const res = await createWhatsappInstanceAction({
        instanceName: newInstanceName.trim(),
        branchId: newBranchId !== "none" ? newBranchId : undefined,
      });

      if (res.success) {
        toast.success(`Instance ${newInstanceName} berhasil dibuat.`);
        setSelectedInstanceName(newInstanceName.trim());
        setIsCreateOpen(false);
        setNewInstanceName("");
        setNewBranchId("none");
        await fetchDashboard();
      } else {
        toast.error(res.error || "Gagal membuat instance baru.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat membuat instance.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!selectedInstanceName) return;

    setIsDeleting(true);
    try {
      const res = await deleteWhatsappInstanceAction({
        instanceName: selectedInstanceName,
      });

      if (res.success) {
        toast.success(`Instance ${selectedInstanceName} berhasil dihapus.`);
        setIsDeleteOpen(false);
        await fetchDashboard();
        const remaining = dashboard?.instances.filter((i) => i.instanceName !== selectedInstanceName) || [];
        if (remaining.length > 0) {
          setSelectedInstanceName(remaining[0].instanceName);
        }
      } else {
        toast.error(res.error || "Gagal menghapus instance.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus instance.");
    } finally {
      setIsDeleting(false);
    }
  };

  const currentInstanceInfo: BranchInstanceInfo | undefined = dashboard?.instances.find(
    (i) => i.instanceName.toLowerCase() === selectedInstanceName.toLowerCase()
  );

  const isConnected = status?.connected ?? false;
  const isUnreachable = status?.state === "unreachable";

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Actions */}
      <div className="p-6 bg-card border rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Server className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                WhatsApp Multi-Instance Gateway
              </h2>
              <Badge variant="outline" className="text-xs font-mono">
                {dashboard?.instances.length || 0} Instance Terdaftar
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Setiap cabang dapat memiliki nomor WhatsApp dan instance terpisah untuk pengiriman struk digital.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchDashboard();
              refreshStatus();
            }}
            disabled={loadingDashboard || isLoadingStatus}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDashboard || isLoadingStatus ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah Instance Baru
          </Button>
        </div>
      </div>

      {/* 2. Instance Grid / Selector Tabs */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Pilih Instance / Cabang untuk Dikelola
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {dashboard?.instances.map((inst) => {
            const isSelected = inst.instanceName.toLowerCase() === selectedInstanceName.toLowerCase();
            return (
              <div
                key={inst.instanceName}
                onClick={() => setSelectedInstanceName(inst.instanceName)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20"
                    : "bg-card hover:border-border/80 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-semibold text-sm truncate text-foreground">
                    {inst.branchName ? inst.branchName : inst.instanceName}
                  </div>
                  {inst.connected ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] shrink-0 gap-1 px-1.5 py-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Aktif
                    </Badge>
                  ) : inst.state === "connecting" ? (
                    <Badge variant="outline" className="border-amber-500 text-amber-600 text-[10px] shrink-0 gap-1 px-1.5 py-0.5">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      Pairing
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] shrink-0 px-1.5 py-0.5">
                      Terputus
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground font-mono truncate">
                  Instance: {inst.instanceName}
                </div>

                <div className="text-xs mt-2 flex items-center justify-between text-muted-foreground">
                  <span>Nomor WA:</span>
                  <span className="font-mono font-medium text-foreground">
                    {inst.owner ? `+${inst.owner}` : "-"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Instance Detailed Pairing & Test Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pairing Scanner / Code */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-card border rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h3 className="font-semibold text-base text-foreground">
                  Status & Penautan: <span className="font-mono text-emerald-600">{selectedInstanceName}</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {currentInstanceInfo?.branchName
                    ? `Terhubung ke cabang: ${currentInstanceInfo.branchName}`
                    : "Instance mandiri (belum ditautkan ke cabang)"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs gap-1"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Instance
                </Button>
              </div>
            </div>

            {isConnected ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <div className="font-semibold text-lg text-foreground">Perangkat WhatsApp Terhubung</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Nomor aktif: <span className="font-mono font-bold text-foreground">+{status?.owner || "-"}</span>
                  </div>
                  {status?.profileName && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Nama profil: {status.profileName}
                    </div>
                  )}
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
                  <div className="flex flex-col items-center justify-center p-6 bg-muted/20 border rounded-xl min-h-[280px]">
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
                          Menunggu scan dari WhatsApp... QR code otomatis refresh.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <QrCode className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                        <p className="text-xs text-muted-foreground max-w-xs">
                          Klik tombol di bawah untuk meminta QR Code penautan ke Evolution API.
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
                      <Label className="text-xs font-semibold">Nomor Telepon Akun WhatsApp</Label>
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
                        Format 08xx akan otomatis dikonversi ke format internasional 628xx.
                      </p>
                    </div>

                    {qrCodeData?.pairingCode && (
                      <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-2">
                        <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                          Masukkan kode berikut pada WhatsApp di ponsel:
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
          </div>
        </div>

        {/* Right Column: Test Message Sandbox & Branch Linking */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-card border rounded-2xl shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-foreground">Uji Coba Pengiriman Pesan</h3>
            <p className="text-xs text-muted-foreground">
              Verifikasi bahwa instance <span className="font-mono font-bold">{selectedInstanceName}</span> dapat mengirimkan pesan keluar.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nomor Tujuan</Label>
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
              <Label className="text-xs font-semibold">Pesan Teks</Label>
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
          </div>
        </div>
      </div>

      {/* Dialog: Create Instance */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Buat Instance WhatsApp Baru</DialogTitle>
            <DialogDescription className="text-xs">
              Buat instance baru di Evolution API dan tautkan langsung ke cabang pilihan Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nama Instance</Label>
              <Input
                placeholder="misal: nyenyak-gatotsubroto"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Gunakan huruf kecil, angka, dan tanda hubung (-).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tautkan ke Cabang (Opsional)</Label>
              <Select value={newBranchId} onValueChange={setNewBranchId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Pilih cabang untuk ditautkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Jangan tautkan sekarang --</SelectItem>
                  {dashboard?.branchesWithoutInstance.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.name} ({b.subdomain})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmittingCreate}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={handleCreateInstance}
              disabled={isSubmittingCreate || !newInstanceName.trim()}
            >
              {isSubmittingCreate ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Membuat...
                </>
              ) : (
                "Buat Instance"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Delete Instance */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Instance WhatsApp `{selectedInstanceName}`?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus instance dari server Evolution API dan melepaskan tautan dari cabang terkait. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInstance}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus Instance"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Logout / Unpair */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Putuskan Sambungan WhatsApp `{selectedInstanceName}`?</AlertDialogTitle>
            <AlertDialogDescription>
              Perangkat WhatsApp akan dikeluarkan dari sesi aktif. Pengiriman pesan struk otomatis akan terhenti sampai perangkat dipindai kembali.
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
