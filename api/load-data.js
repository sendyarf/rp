const { list } = require('@vercel/blob');

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

  const { userId } = req.body;

  // Validasi userId
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.error('Invalid userId in request body:', userId);
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid userId',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const filename = 'users.json';
    let data = null;

    // Ambil daftar blob yang tersedia
    const blobs = await list();
    const blob = blobs.blobs.find(b => b.pathname === filename);
    
    if (blob) {
      // Ambil data dari blob dengan header no-cache
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
      
      const jsonData = await response.json();
      
      // Cari data untuk userId yang diberikan
      data = jsonData.users && jsonData.users[userId];
      console.log('Data request for userId:', userId, 'Data found:', data ? 'Yes' : 'No');
    } else {
      console.log('No users.json file found');
    }

    // Set header no-cache untuk respons
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Jika data ditemukan, kembalikan dengan sukses
    if (data) {
      return res.status(200).json({ 
        success: true, 
        data,
        timestamp: new Date().toISOString()
      });
    } else {
      // Jika data tidak ditemukan, kembalikan 404
      console.log('No data found for userId:', userId);
      return res.status(404).json({ 
        success: false, 
        error: 'No data found',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    // Log dan kembalikan error
    console.error('Error loading data from JSON:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};