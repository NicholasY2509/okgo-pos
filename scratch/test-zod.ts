import { z } from "zod";
const schema = z.coerce.number().min(1);
console.log(schema.safeParse(undefined));
console.log(schema.safeParse(""));
console.log(schema.safeParse(null));
console.log(schema.safeParse(NaN));
