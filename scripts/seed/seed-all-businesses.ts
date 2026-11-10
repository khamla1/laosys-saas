import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  console.log("Starting to seed ALL 9 business types with products, images, and orders...");
  try {
    const { seedAllBusinesses } = await import("../src/lib/seed-all");
    const result = await seedAllBusinesses();
    console.log("Seeding completed successfully!", result);
    process.exit(0);
  } catch (err) {
    console.error("Error during seeding:", err);
    process.exit(1);
  }
}

main();
