/**
 * Full pipeline integration test
 * Run with: node test-full-pipeline.js
 */

require('dotenv').config({ path: '.env.local' });

// Load the compiled TypeScript modules
const fs = require('fs');
const path = require('path');

// We need to import the compiled JS, so let's use the TypeScript directly via ts-node or check if dist exists
// For now, let's write a simpler test that hits the API endpoints

async function testFullPipeline() {
  console.log('🚀 Starting Full Pipeline Test\n');

  const projectData = {
    name: 'Test Video - ' + new Date().toISOString().slice(0, 19).replace('T', ' '),
    topic: 'The benefits of daily walking for health',
    duration: 60,
  };

  console.log('📝 Creating project:', projectData.name);
  console.log('   Topic:', projectData.topic);
  console.log('   Duration:', projectData.duration, 'seconds\n');

  try {
    // Step 1: Create project and trigger generation
    console.log('📤 Sending generation request to /api/projects...');
    const createResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(`Project creation failed: ${createData.error || JSON.stringify(createData)}`);
    }

    console.log('✅ Project created successfully!');
    console.log('   Project ID:', createData.project?.id);
    console.log('   Job ID:', createData.jobId);
    console.log('   Script length:', createData.script?.length || 0, 'chars');
    console.log('   Scenes:', createData.storyboard?.scenes?.length || 0);

    if (createData.storyboard) {
      console.log('\n📋 Storyboard details:');
      createData.storyboard.scenes.forEach((scene, i) => {
        console.log(`   Scene ${i + 1}: ${scene.visualType} (${scene.duration}s) - ${scene.narrationText.slice(0, 60)}...`);
      });
    }

    if (createData.videoUrl) {
      console.log('\n🎬 Video generated:', createData.videoUrl);
      console.log('   Full URL: http://localhost:3000' + createData.videoUrl);
    } else {
      console.log('\n⏳ Video URL not yet available (rendering may be async)');
    }

    // Step 2: Poll for completion if needed
    if (!createData.videoUrl && createData.jobId) {
      console.log('\n🔄 Polling job status...');
      let attempts = 0;
      const maxAttempts = 60; // 60 attempts * 5 seconds = 5 minutes max

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

        const jobResponse = await fetch(`http://localhost:3000/api/jobs/${createData.jobId}`);
        const jobData = await jobResponse.json();

        console.log(`   Attempt ${attempts}/${maxAttempts}: Stage=${jobData.stage}, Status=${jobData.status}, Progress=${jobData.progress}%`);

        if (jobData.status === 'completed' && jobData.videoUrl) {
          console.log('\n✅ Video rendering completed!');
          console.log('   Video URL: http://localhost:3000' + jobData.videoUrl);
          break;
        }

        if (jobData.status === 'failed') {
          console.log('\n❌ Pipeline failed:', jobData.error);
          break;
        }

        if (attempts >= maxAttempts) {
          console.log('\n⏰ Timeout waiting for completion');
        }
      }
    }

    // Step 3: Verify exports directory
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    if (fs.existsSync(exportsDir)) {
      const files = fs.readdirSync(exportsDir);
      console.log('\n📁 Exports directory contents:', files);
    }

  } catch (error) {
    console.error('\n❌ Pipeline test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  console.log('\n✨ Pipeline test complete!');
}

testFullPipeline();