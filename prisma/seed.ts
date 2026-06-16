import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = ' '

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log(`User with email ${email} already exists!`)
    return
  }

  // Hash the password securely
  const passwordHash = await bcrypt.hash('password123', 10)

  // Insert mock user
  const user = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: email,
      password: passwordHash,
    },
  })

  console.log('✅ Mock user created successfully:')
  console.log(`   Email:    ${user.email}`)
  console.log(`   Password: password123`)

  // Seed Roles
  const roles = [
    { name: 'Admin', description: 'Super Administrator' },
    { name: 'Manager', description: 'Branch Manager' },
    { name: 'Cashier', description: 'Branch Cashier' },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    })
  }
  
  console.log('✅ Default roles created successfully')
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
