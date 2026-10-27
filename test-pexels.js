/**
 * Test script to verify Pexels Asset Provider connection
 * Run with: node test-pexels.js
 */

require('dotenv').config({ path: '.env.local' });

async function testPexels() {
  const apiKey = process.env.PEXELS_API_KEY;

  console.log('🔍 Testing Pexels Asset Provider...\n');
  console.log(`API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NOT SET'}\n`);

  // Test 1: Check if API key is available
  console.log('Test 1: API key availability...');
  if (!apiKey) {
    console.log('❌ API key not configured');
    return;
  }
  console.log('✅ API key is configured');

  // Test 2: Test search functionality
  console.log('\nTest 2: Testing search...');
  try {
    const response = await fetch(
      'https://api.pexels.com/videos/search?query=nature&orientation=portrait&per_page=2',
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      console.log(`❌ Search failed (${response.status}): ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error:', errorText);
      return;
    }

    const data = await response.json();
    const videos = data.videos || [];
    console.log(`✅ Search successful! Found ${videos.length} videos`);

    if (videos.length > 0) {
      console.log('\nSample video data:');
      console.log('ID:', videos[0].id);
      console.log('Duration:', videos[0].duration);
      console.log('Width:', videos[0].width);
      console.log('Height:', videos[0].height);
      console.log('Image URL:', videos[0].image);
      console.log('Video files:', videos[0].video_files?.length);

      if (videos[0].video_files?.length > 0) {
        const portraitFile = videos[0].video_files.find(f => f.height > f.width) || videos[0].video_files[0];
        console.log('Portrait video URL:', portraitFile?.link || 'N/A');
      }
    }
  } catch (error) {
    console.log('❌ Search test failed:', error.message);
  }

  // Test 3: Test PexelsAssetProvider class
  console.log('\nTest 3: Testing PexelsAssetProvider class...');
  try {
    const { PexelsAssetProvider } = await import('./src/lib/providers/assets');

    const provider = new PexelsAssetProvider(apiKey);

    console.log('Provider name:', provider.getName());
    console.log('Provider available:', await provider.isAvailable());

    if (await provider.isAvailable()) {
      console.log('\nTest 4: Testing search method via class...');
      const searchResults = await provider.search('sunset', {
        type: 'video',
        orientation: 'portrait',
        maxResults: 1,
      });

      if (searchResults.length > 0) {
        console.log('✅ Search via provider successful! Found 1 asset');
        console.log('Asset ID:', searchResults[0].id);
        console.log('Asset source:', searchResults[0].source);
        console.log('Asset license:', searchResults[0].license);

        console.log('\nTest 5: Testing download method...');
        try {
          const localPath = await provider.download(searchResults[0]);
          console.log('✅ Download successful! Local path:', localPath);
        } catch (downloadError) {
          console.log('⚠️ Download failed (expected for external files):', downloadError.message);
        }
      } else {
        console.log('❌ Provider search returned no results');
      }
    }
  } catch (error) {
    console.log('❌ Provider class test failed:', error.message);
  }

  console.log('\n✨ Test complete!');
}

testPexels();
