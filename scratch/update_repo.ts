import * as fs from 'fs';

let file = fs.readFileSync('modules/booking/repositories/booking-repository.ts', 'utf8');

const target1 = `        subtotal += Number(service.price);

        transactionItems.push({
          type: "SERVICE",
          serviceId: service.id,
          itemNameSnapshot: service.name,
          unitPrice: service.price,
          subtotal: service.price,
          quantity: 1,
          _assignedRoomId: assignedRoom.id,
          _assignedStaffId: assignedStaff?.id || null,
          _duration: service.duration || 60
        });
      }`;

const replacement1 = `        let itemSubtotal = Number(service.price);
        if (sel.appliedVoucherId) {
          itemSubtotal = 0;
        }
        subtotal += itemSubtotal;

        transactionItems.push({
          type: "SERVICE",
          serviceId: service.id,
          itemNameSnapshot: service.name,
          unitPrice: service.price,
          subtotal: itemSubtotal,
          quantity: 1,
          _assignedRoomId: assignedRoom.id,
          _assignedStaffId: assignedStaff?.id || null,
          _duration: service.duration || 60,
          _appliedVoucherId: sel.appliedVoucherId || null
        });
      }`;

file = file.replace(target1, replacement1);

const target2 = `          items: {
            create: transactionItems.map(item => ({
              serviceId: item.serviceId,
              itemNameSnapshot: item.itemNameSnapshot,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              quantity: item.quantity
            }))
          }`;

const replacement2 = `          items: {
            create: transactionItems.map((item: any) => ({
              serviceId: item.serviceId,
              itemNameSnapshot: item.itemNameSnapshot,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              quantity: item.quantity,
              appliedVoucherId: item._appliedVoucherId || undefined
            }))
          }`;

file = file.replace(target2, replacement2);
fs.writeFileSync('modules/booking/repositories/booking-repository.ts', file);
