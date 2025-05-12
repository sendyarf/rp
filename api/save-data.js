const { put, list } = require('@vercel/blob');

module.exports = async (req, res) => {
  const { userId, points, history } = req.body;

  if (!userId || points == null || !Array.isArray(history)) {
    console.error('Invalid request body:', req.body);
    return res.status(400).json({ success: false, error: 'Invalid data' });
  }

  try {
    const filename = 'users.json';
    let existingData = { users: {} };

    // Ambil file JSON yang ada
    try {
      const blobs = await list();
      const blob = blobs.blobs.find(b => b.pathname === filename);
      if (blob) {
        const response = await fetch(blob.url);
        existingData = await response.json();
        console.log('Existing JSON data loaded:', Object.keys(existingData.users));
      } else {
        console.log('No existing JSON file found, creating new one');
      }
    } catch (e) {
      console.error('Error loading existing JSON:', e);
    }

    // Perbarui data pengguna
    existingData.users[userId] = { points, history };

    // Simpan kembali ke Vercel Blob
    await put(filename, JSON.stringify(existingData, null, 2), {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log('Data saved to JSON for userId:', userId);
    res.json({ success: true });
  } catch (e) {
    console.error('Error saving data to JSON:', e);
    res.status(500).json({ success: false, error: e.message });
  }
};