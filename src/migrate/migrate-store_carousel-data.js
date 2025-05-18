

/* migrate and delete to 
delete model uncomment like 46 to 48  to delete 
collection uncomment like 54 to 56*/



// src/migrate/migrate-store_carousel-data.js
import mongoose from "mongoose";
import 'dotenv/config';
import { DB_NAME } from "../constants.js";

// Migration function
async function migrateData() {
  try {
    // Connect to the database
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to database:", mongoose.connection.db.databaseName);

    // Access the collections directly
    const carouselsCollection = mongoose.connection.db.collection("carousels");
    const storeCarouselsCollection = mongoose.connection.db.collection("store_carousels");

    // Fetch all documents from carousels
    const carousels = await carouselsCollection.find().toArray();
    console.log(`Found ${carousels.length} documents in carousels`);

    if (carousels.length === 0) {
      console.log("No documents to migrate. Check if 'carousels' exists in this database.");
      await mongoose.disconnect();
      return;
    }

    // Migrate each document to store_carousels
    for (const carousel of carousels) {
      // Remove _id to avoid duplicate key errors in store_carousels
      const { _id, ...data } = carousel;
      await storeCarouselsCollection.insertOne(data);
      console.log(`Migrated document: ${carousel._id}`);
    }

    console.log("Migration completed successfully");

    // // Delete documents from carousels after migration
    // await carouselsCollection.deleteMany({});
    // console.log("Deleted all documents from carousels collection");



    // Optional: Drop the carousels collection entirely

    // Uncomment the line below if you want to delete the collection completely
    // await carouselsCollection.drop();
    // console.log("Dropped carousels collection");

    // Disconnect from the database
    await mongoose.disconnect();
  } catch (error) {
    console.error("Migration failed:", error);
    await mongoose.disconnect();
  }
}

// Run the migration
migrateData();