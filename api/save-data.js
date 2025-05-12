const { put, list } = require('@vercel/blob');

module.exports = async (req, res) => {
  const { userId, points, history } = req.body;

  try {
    // Nama file JSON
    const filename = 'users.json';

    // Ambil file JSON yang ada
    let existingData = { users: {} };
    try {
      const blobs = await list();
      const blob = blobs.blobs.find(b => b.pathname === filename);
      if (blob) {
        const response = await fetch(blob.url);
        existingData = await response.json();
      }
    } catch (e) {
      console.log('No existing JSON file found, creating new one');
    }

    // Perbarui data pengguna
    existingData.users[userId] = { points, history };

    // Simpan kembali ke Vercel Blob
    await put(filename, JSON.stringify(existingData, null, 2), {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    res.json({ success: true });
  } catch (e) {
    console.error('Error saving data to JSON:', e);
    res.json({ success: false, error: e.message });
  }
};