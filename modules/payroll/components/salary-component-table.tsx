"use client"

import { useState } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { formatIDR } from "@/lib/utils"
import { useSalaryComponent } from "../hooks/use-salary-component"
import { SalaryComponentForm } from "./salary-component-form"

interface SalaryComponent {
  id: string
  code: string
  name: string
  isDeduction: boolean
  type: string
  amount: any
}

interface SalaryComponentTableProps {
  data: SalaryComponent[]
}

export function SalaryComponentTable({ data }: SalaryComponentTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const { onDelete } = useSalaryComponent()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Komponen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Komponen Gaji</DialogTitle>
            </DialogHeader>
            <SalaryComponentForm 
              onSuccess={() => setIsAddOpen(false)}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Komponen</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Nilai Default</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Belum ada data komponen gaji.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    {item.isDeduction ? (
                      <Badge variant="destructive">Potongan</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600">Tunjangan</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.type === "PERCENTAGE" 
                      ? `${item.amount}%` 
                      : formatIDR(Number(item.amount))}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Dialog open={editingId === item.id} onOpenChange={(open) => setEditingId(open ? item.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Komponen Gaji</DialogTitle>
                          </DialogHeader>
                          <SalaryComponentForm 
                            defaultValues={{
                              ...item,
                              amount: Number(item.amount)
                            }}
                            onSuccess={() => setEditingId(null)}
                            onCancel={() => setEditingId(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500"
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus komponen ${item.name}?`)) {
                            onDelete(item.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
