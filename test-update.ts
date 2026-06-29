import { updateProductAction } from "./modules/product/actions/product-action";
import { prisma } from "./lib/prisma";

async function run() {
  const product = await prisma.product.findFirst();
  if (!product) { console.log("No product"); return; }
  
  console.log("Original isVip:", product.isVip);
  const result = await updateProductAction({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    isVip: !product.isVip,
    isActive: product.isActive
  });
  console.log("Action result:", result);
  
  const updated = await prisma.product.findUnique({ where: { id: product.id } });
  console.log("New isVip:", updated?.isVip);
}
run();
