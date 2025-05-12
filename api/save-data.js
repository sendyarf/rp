const { put, list } = require('@vercel/blob');

module.exports = async (req, res) => {
  // Tambahkan header CORS untuk memastikan API dapat diakses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validasi metode request
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  const { userId, points, history } = req.body;

  // Validasi userId
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.error('Invalid userId:', userId);
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid userId',
      timestamp: new Date().toISOString()
    });
  }

  // Validasi points
  if (points === undefined || points === null || isNaN(Number(points))) {
    console.error('Invalid points:', points);
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid points',
      timestamp: new Date().toISOString()
    });
  }

  // Validasi history
  if (!Array.isArray(history)) {
    console.error('Invalid history:', history);
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid history',
      timestamp: new Date().toISOString()
    });
  }

  // Konversi points ke number untuk memastikan konsistensi tipe data
  const numPoints = Number(points);

  try {
    const filename = 'users.json';
    let existingData = { users: {} };

    // Ambil file JSON yang ada
    try {
      const blobs = await list();
      const blob = blobs.blobs.find(b => b.pathname === filename);
      
      if (blob) {
        const response = await fetch(blob.url, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }
        
        existingData = await response.json();
        console.log('Existing JSON data loaded for userId:', userId, 'Keys:', Object.keys(existingData.users).length);
      } else {
        console.log('No users.json found, creating new one');
        await put(filename, JSON.stringify({ users: {} }, null, 2), {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false // Pastikan nama file tetap sama
        });
        console.log('Created new users.json');
      }
    } catch (error) {
      console.error('Error checking existing JSON:', error);
      // Coba buat file baru jika gagal membaca
      await put(filename, JSON.stringify({ users: {} }, null, 2), {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false // Pastikan nama file tetap sama
      });
      console.log('Created new users.json after error');
    }

    // Perbarui data pengguna
    existingData.users[userId] = { 
      points: numPoints, 
      history: history,
      lastUpdated: new Date().toISOString()
    };

    // Simpan kembali ke Vercel Blob
    await put(filename, JSON.stringify(existingData, null, 2), {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false // Pastikan nama file tetap sama
    });

    console.log('Data saved to JSON for userId:', userId, 'Points:', numPoints);
    
    // Set header no-cache untuk respons
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json({ 
      success: true,
      message: 'Data saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving data to JSON:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};