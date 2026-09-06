import * as fs from 'fs';

let repoFile = fs.readFileSync('modules/booking/repositories/booking-repository.ts', 'utf8');

repoFile = repoFile.replace(
  /include: { items: true }/g,
  `include: { items: { include: { appliedVoucher: { include: { voucherPacket: { include: { product: true } } } } } } }`
);
repoFile = repoFile.replace(
  /include: { items: true, serviceSessions: true }/g,
  `include: { items: { include: { appliedVoucher: { include: { voucherPacket: { include: { product: true } } } } } }, serviceSessions: true }`
);

fs.writeFileSync('modules/booking/repositories/booking-repository.ts', repoFile);


let listRepoFile = fs.readFileSync('modules/booking/repositories/booking-list-repository.ts', 'utf8');

const target1 = `      include: {
        customer: true,
        items: true,
        appliedVoucher: {`;

const replacement1 = `      include: {
        customer: true,
        items: {
          include: {
            appliedVoucher: {
              include: { voucherPacket: { include: { product: true } } }
            }
          }
        },
        appliedVoucher: {`;

listRepoFile = listRepoFile.replace(target1, replacement1);

const target2 = `        include: {
          items: true,
          serviceSessions: true
        }`;

const replacement2 = `        include: {
          items: {
            include: {
              appliedVoucher: {
                include: { voucherPacket: { include: { product: true } } }
              }
            }
          },
          serviceSessions: true
        }`;
        
listRepoFile = listRepoFile.replace(target2, replacement2);

fs.writeFileSync('modules/booking/repositories/booking-list-repository.ts', listRepoFile);

