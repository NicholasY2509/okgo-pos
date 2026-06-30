import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = 'admin@example.com'

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  let adminUser;
  if (!existingUser) {
    // Hash the password securely
    const passwordHash = await bcrypt.hash('password123', 10)

    // Insert mock user
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: email,
        password: passwordHash,
      },
    })
    console.log('✅ Mock user created successfully:')
    console.log(`   Email:    ${adminUser.email}`)
    console.log(`   Password: password123`)
  } else {
    adminUser = existingUser;
  }

  // Seed Roles
  const roles = [
    { name: 'Admin', description: 'Super Administrator' },
    { name: 'Manager', description: 'Branch Manager' },
    { name: 'Cashier', description: 'Branch Cashier' },
  ]

  const createdRoles: Record<string, string> = {}
  for (const role of roles) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    })
    createdRoles[role.name] = r.id
  }

  console.log('✅ Default roles created successfully')

  // Seed Branches
  const existingBranchCount = await prisma.branch.count()
  const createdBranches = []
  if (existingBranchCount === 0) {
    const b1 = await prisma.branch.create({ data: { name: 'Nyenyak Juanda', subdomain: 'juanda', address: 'Jl. Juanda', phone: '021123456' } })
    const b2 = await prisma.branch.create({ data: { name: 'Nyenyak Amir Hamzah', subdomain: 'amir-hamzah', address: 'Jl. Amir Hamzah', phone: '021654321' } })
    createdBranches.push(b1, b2)
    console.log('✅ Default branches created')
  } else {
    createdBranches.push(...await prisma.branch.findMany())
    console.log('ℹ️ Branches already exist, using existing ones')
  }

  // Seed WorkPositions & Staff if empty
  const existingStaffCount = await prisma.staff.count()
  if (existingStaffCount === 0) {
    const wp1 = await prisma.workPosition.create({ data: { name: 'Terapis', description: 'Terapis Pijat' } })
    const wp2 = await prisma.workPosition.create({ data: { name: 'Resepsionis', description: 'Resepsionis Depan' } })
    const wp3 = await prisma.workPosition.create({ data: { name: 'Manajer Cabang', description: 'Manajer' } })
    const wps = [wp1, wp2, wp3]

    const firstNames = ["Budi", "Siti", "Andi", "Dewi", "Rudi", "Nina", "Eko", "Maya", "Agus", "Rini", "Hadi", "Lia", "Iwan", "Sari", "Yudi", "Rika"]
    const lastNames = ["Santoso", "Aminah", "Wijaya", "Lestari", "Setiawan", "Sari", "Pratama", "Putri", "Kurniawan", "Ningsih"]

    let staffCreated = 0
    let usersCreated = 0

    for (let i = 0; i < 25; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const wp = wps[Math.floor(Math.random() * wps.length)]
      const branch = createdBranches[Math.floor(Math.random() * createdBranches.length)]

      const staffEmail = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.com`

      const staff = await prisma.staff.create({
        data: {
          firstName: fName,
          lastName: lName,
          phone: `081${Math.floor(100000000 + Math.random() * 900000000)}`,
          email: staffEmail,
          workPositionId: wp.id,
          branchId: branch?.id
        }
      })
      staffCreated++

      // Create users for Resepsionis & Manajer Cabang
      if (wp.name === 'Resepsionis' || wp.name === 'Manajer Cabang') {
        const passwordHash = await bcrypt.hash('password123', 10)
        const user = await prisma.user.create({
          data: {
            name: `${fName} ${lName}`,
            email: staffEmail,
            password: passwordHash,
          }
        })

        await prisma.staffUser.create({
          data: {
            staffId: staff.id,
            userId: user.id
          }
        })

        // Assign BranchStaff role based on WorkPosition
        const roleName = wp.name === 'Manajer Cabang' ? 'Manager' : 'Cashier'
        await prisma.branchStaff.create({
          data: {
            staffId: staff.id,
            branchId: branch.id,
            roleId: createdRoles[roleName]
          }
        })
        usersCreated++
      }
    }
    console.log(`✅ Default work positions, ${staffCreated} staff, and ${usersCreated} linked user accounts created`)
  } else {
    console.log('ℹ️ Staff already exists, skipping staff seed')
  }

  // Seed Categories & Products if empty
  const existingProductCount = await prisma.product.count()
  if (existingProductCount === 0) {
    const cat1 = await prisma.category.create({ data: { name: 'Pijat Tradisional', description: 'Perawatan tubuh' } })
    const cat2 = await prisma.category.create({ data: { name: 'Refleksi', description: 'Perawatan kaki' } })
    const cat3 = await prisma.category.create({ data: { name: 'Perawatan Wajah', description: 'Kecantikan wajah' } })
    const cat4 = await prisma.category.create({ data: { name: 'Spa & Lulur', description: 'Perawatan kulit' } })
    const cats = [cat1, cat2, cat3, cat4]

    const productAdjectives = ["Premium", "Eksklusif", "Lengkap", "Kilat", "Intensif", "Spesial", "Relaksasi", "Kebugaran", "Tradisional", "Modern"]
    const productTypes = ["Pijat Seluruh Tubuh", "Refleksi Kaki", "Lulur Keraton", "Totok Wajah", "Pijat Batu Panas", "Pijat Aromaterapi", "Spa Rambut", "Creambath", "Manikur", "Pedikur", "Facial Anti-Aging", "Pijat Punggung"]

    let productsCreated = 0
    for (let i = 0; i < 50; i++) {
      const type = productTypes[Math.floor(Math.random() * productTypes.length)]
      const adj = productAdjectives[Math.floor(Math.random() * productAdjectives.length)]
      const cat = cats[Math.floor(Math.random() * cats.length)]
      const price = (Math.floor(Math.random() * 20) + 5) * 10000
      const duration = [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)]

      await prisma.product.create({
        data: {
          name: `${type} ${adj} ${i + 1}`,
          price: price,
          duration: duration,
          categoryId: cat.id,
        }
      })
      productsCreated++
    }
    console.log(`✅ Default categories and ${productsCreated} products created`)
  } else {
    console.log('ℹ️ Products already exist, skipping product seed')
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
