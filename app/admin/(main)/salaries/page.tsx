import { StaffSalaryService } from "@/modules/staff-salary/services/staff-salary-service"
import { PageHeader } from "@/components/page-header"
import { StaffSalariesTable } from "@/modules/staff-salary/components/staff-salaries-table"
import { StaffSalaryTableData } from "@/modules/staff-salary/components/staff-salaries-columns"

export default async function StaffSalariesPage() {
  const staffWithSalaries = await StaffSalaryService.getAllStaffWithSalaries()

  const tableData: StaffSalaryTableData[] = staffWithSalaries.map(staff => {
    const currentSalary = staff.staffSalaries[0]
    return {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      workPosition: staff.workPosition,
      currentSalary: currentSalary ? {
        id: currentSalary.id,
        baseSalary: Number(currentSalary.baseSalary),
        effectiveDate: currentSalary.effectiveDate,
      } : undefined
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gaji Pokok Staf"
        description="Kelola gaji pokok untuk setiap staf di sistem Anda."
      />

      <StaffSalariesTable data={tableData} />
    </div>
  )
}
