/* Migration Script to Add postIdUnique and inCategoryId to Posts
 * 
 * This script:
 * 1. Adds postIdUnique (globally unique): cars0000000001, pants0000000002, etc.
 * 2. Adds inCategoryId (unique per category): cars1, cars2, pants1, pants2, etc.
 * 3. Processes posts in batches for performance
 * 4. Maintains order based on createdAt (oldest first)
 */

import mongoose from "mongoose";
import 'dotenv/config';
import { DB_NAME } from "../constants.js";

// Migration function
async function migratePostIds() {
  try {
    // Connect to the database
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to database:", mongoose.connection.db.databaseName);

    // Access collections
    const postsCollection = mongoose.connection.db.collection("posts");
    const countersCollection = mongoose.connection.db.collection("counters");

    // Initialize global counter
    await countersCollection.updateOne(
      { _id: "post_counter" },
      { $setOnInsert: { sequence: 0 } },
      { upsert: true }
    );
    console.log("Initialized global counter");

    // Get total posts count
    const totalPosts = await postsCollection.countDocuments();
    console.log(`Found ${totalPosts} posts to migrate`);

    if (totalPosts === 0) {
      console.log("No posts to migrate");
      await mongoose.disconnect();
      return;
    }

    // Process in batches
    const BATCH_SIZE = 5000;
    let globalSequence = 0;
    const categoryCounters = {}; // Track category counters in memory
    let processedCount = 0;

    // Get all posts sorted by createdAt (oldest first)
    const cursor = postsCollection.find({}).sort({ createdAt: 1 });

    let batch = [];
    let bulkOps = [];

    while (await cursor.hasNext()) {
      const post = await cursor.next();
      
      // Increment global counter
      globalSequence++;
      const postIdUnique = `${post.category}${String(globalSequence).padStart(10, '0')}`;

      // Initialize category counter if first time seeing this category
      if (!categoryCounters[post.category]) {
        const existingCounter = await countersCollection.findOne({
          _id: `category_counter_${post.category}`
        });
        
        if (existingCounter) {
          categoryCounters[post.category] = existingCounter.sequence;
        } else {
          categoryCounters[post.category] = 0;
          await countersCollection.insertOne({
            _id: `category_counter_${post.category}`,
            sequence: 0
          });
        }
      }

      // Increment category counter
      categoryCounters[post.category]++;
      const inCategoryId = `${post.category}${categoryCounters[post.category]}`;

      // Add to bulk operations
      bulkOps.push({
        updateOne: {
          filter: { _id: post._id },
          update: {
            $set: {
              postIdUnique: postIdUnique,
              inCategoryId: inCategoryId
            }
          }
        }
      });

      processedCount++;

      // Execute batch when it reaches BATCH_SIZE
      if (bulkOps.length >= BATCH_SIZE) {
        await postsCollection.bulkWrite(bulkOps);
        
        // Update global counter
        await countersCollection.updateOne(
          { _id: "post_counter" },
          { $set: { sequence: globalSequence } }
        );

        // Update category counters
        for (const [category, count] of Object.entries(categoryCounters)) {
          await countersCollection.updateOne(
            { _id: `category_counter_${category}` },
            { $set: { sequence: count } }
          );
        }

        console.log(`Processed ${processedCount}/${totalPosts} posts (${Math.round(processedCount/totalPosts*100)}%)`);
        bulkOps = [];
      }
    }

    // Process remaining posts
    if (bulkOps.length > 0) {
      await postsCollection.bulkWrite(bulkOps);
      
      // Update global counter
      await countersCollection.updateOne(
        { _id: "post_counter" },
        { $set: { sequence: globalSequence } }
      );

      // Update category counters
      for (const [category, count] of Object.entries(categoryCounters)) {
        await countersCollection.updateOne(
          { _id: `category_counter_${category}` },
          { $set: { sequence: count } }
        );
      }

      console.log(`Processed ${processedCount}/${totalPosts} posts (100%)`);
    }

    console.log("\n✅ Migration completed successfully!");
    console.log(`Total posts migrated: ${globalSequence}`);
    console.log("\nCategory breakdown:");
    for (const [category, count] of Object.entries(categoryCounters)) {
      console.log(`  ${category}: ${count} posts`);
    }

    // Show sample results
    console.log("\n📊 Sample migrated posts:");
    const samples = await postsCollection.find({})
      .sort({ createdAt: 1 })
      .limit(5)
      .toArray();
    
    samples.forEach((post, idx) => {
      console.log(`\n  Post ${idx + 1}:`);
      console.log(`    _id: ${post._id}`);
      console.log(`    postIdUnique: ${post.postIdUnique}`);
      console.log(`    inCategoryId: ${post.inCategoryId}`);
      console.log(`    category: ${post.category}`);
      console.log(`    createdAt: ${post.createdAt}`);
    });

    // Disconnect from the database
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from database");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the migration
migratePostIds();