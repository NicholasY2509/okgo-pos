import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export async function BranchPerformanceTab({ branchId }: { branchId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performa Cabang</CardTitle>
        <CardDescription>Metrik performa untuk cabang ini.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground text-sm py-4">Data performa belum tersedia.</div>
      </CardContent>
    </Card>
  )
}
