/* Migration Script to Sync Post Counters
 * 
 * Purpose: Fix E11000 duplicate key errors by resetting counters
 * based on existing posts in the database
 * 
 * This script:
 * 1. Scans all existing posts
 * 2. Finds the highest postIdUnique and inCategoryId sequences
 * 3. Updates the counters collection to match
 * 4. Ensures future posts won't have duplicate IDs
 */

import mongoose from "mongoose";
import 'dotenv/config';
import { DB_NAME } from "../constants.js";

// Sync counters function
async function syncPostCounters() {
  try {
    // Connect to the database
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to database:", mongoose.connection.db.databaseName);

    // Access collections
    const postsCollection = mongoose.connection.db.collection("posts");
    const countersCollection = mongoose.connection.db.collection("postuniqueids");

    console.log("\n🔄 Starting counter synchronization...");

    // Get total posts count
    const totalPosts = await postsCollection.countDocuments();
    console.log(`📊 Found ${totalPosts} posts in database`);

    if (totalPosts === 0) {
      console.log("⚠️  No posts found. Initializing counters to 0.");
      
      // Initialize global counter to 0
      await countersCollection.updateOne(
        { _id: "post_counter" },
        { $set: { sequence: 0 } },
        { upsert: true }
      );
      
      console.log("✅ Migration completed - counters initialized to 0");
      await mongoose.disconnect();
      console.log("🔌 Database disconnected");
      return;
    }

    // Fetch all posts to analyze
    const posts = await postsCollection.find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Find max global sequence and category sequences
    let maxGlobalSeq = 0;
    const categoryMaxSeq = {};

    console.log("\n🔍 Analyzing existing posts...");

    posts.forEach((post, index) => {
      // Extract number from postIdUnique (e.g., "car0000000002" -> 2)
      if (post.postIdUnique) {
        const globalMatch = post.postIdUnique.match(/(\d+)$/);
        if (globalMatch) {
          const seq = parseInt(globalMatch[1], 10);
          maxGlobalSeq = Math.max(maxGlobalSeq, seq);
        }
      }

      // Extract number from inCategoryId (e.g., "car2" -> 2)
      if (post.inCategoryId && post.category) {
        const categoryMatch = post.inCategoryId.match(/(\d+)$/);
        if (categoryMatch) {
          const seq = parseInt(categoryMatch[1], 10);
          const cat = post.category || "All";
          categoryMaxSeq[cat] = Math.max(categoryMaxSeq[cat] || 0, seq);
        }
      }

      // Progress indicator
      if ((index + 1) % 1000 === 0) {
        console.log(`   Processed ${index + 1}/${totalPosts} posts...`);
      }
    });

    console.log("\n📈 Maximum sequences found:");
    console.log(`   Global sequence: ${maxGlobalSeq}`);
    console.log(`   Categories:`, categoryMaxSeq);

    // Update global counter
    console.log("\n⚙️  Updating counters...");
    
    await countersCollection.updateOne(
      { _id: "post_counter" },
      { $set: { sequence: maxGlobalSeq } },
      { upsert: true }
    );
    console.log(`✅ Global counter set to: ${maxGlobalSeq}`);

    // Update category counters
    let categoriesUpdated = 0;
    for (const [category, maxSeq] of Object.entries(categoryMaxSeq)) {
      await countersCollection.updateOne(
        { _id: `category_counter_${category}` },
        { $set: { sequence: maxSeq } },
        { upsert: true }
      );
      console.log(`✅ Category "${category}" counter set to: ${maxSeq}`);
      categoriesUpdated++;
    }

    console.log(`\n✅ Updated ${categoriesUpdated} category counters`);

    // Verify the updates
    console.log("\n🔍 Verifying counter updates...");
    const globalCounter = await countersCollection.findOne({ _id: "post_counter" });
    console.log(`   Global counter now at: ${globalCounter?.sequence || 0}`);

    // Show sample of category counters
    const categorySamples = await countersCollection
      .find({ _id: /^category_counter_/ })
      .limit(5)
      .toArray();
    
    if (categorySamples.length > 0) {
      console.log("   Sample category counters:");
      categorySamples.forEach(counter => {
        const categoryName = counter._id.replace('category_counter_', '');
        console.log(`     ${categoryName}: ${counter.sequence}`);
      });
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log("💡 You can now create new posts without duplicate key errors.");

    // Disconnect from the database
    await mongoose.disconnect();
    console.log("\n🔌 Database disconnected");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error("Error details:", error.message);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("🔌 Database disconnected");
    }
    
    process.exit(1);
  }
}

// Run the migration
syncPostCounters()
  .then(() => {
    console.log("\n✅ Script execution completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script execution failed:", error);
    process.exit(1);
  });