"use client"

import { useJournalEntryForm } from "../hooks/use-journal-entry"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2 } from "lucide-react"

export function JournalForm({ branchId, accounts }: { branchId: string, accounts: any[] }) {
  const { form, lineFields, append, remove, onSubmit, isSubmitting, error } = useJournalEntryForm(branchId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Journal Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. INV-123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Description of the entry" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Journal Lines</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ ledgerAccountId: "", debit: 0, credit: 0 })}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Line
                </Button>
              </div>

              {lineFields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <FormField
                    control={form.control}
                    name={`lines.${index}.ledgerAccountId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`lines.${index}.debit`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormControl>
                          <Input type="number" placeholder="Debit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`lines.${index}.credit`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormControl>
                          <Input type="number" placeholder="Credit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-1"
                    onClick={() => remove(index)}
                    disabled={lineFields.length <= 2}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {error && <p className="text-red-500 font-medium">{error}</p>}
            {form.formState.errors.lines?.root && (
              <p className="text-red-500 font-medium">{form.formState.errors.lines.root.message}</p>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Posting..." : "Post Journal Entry"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
