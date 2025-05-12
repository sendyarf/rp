const { put, list } = require('@vercel/blob');

module.exports = async (req, res) => {
  const { userId, points, history } = req.body;

  if (!userId || points == null || !Array.isArray(history)) {
    console.error('Invalid request body:', req.body);
    return res.status(400).json({ success: false, error: 'Invalid data' });
  }

  let retries = 3;
  while (retries > 0) {
    try {
      const filename = 'users.json';
      let existingData = { users: {} };

      // Ambil file JSON yang ada
      try {
        const blobs = await list();
        const blob = blobs.blobs.find(b => b.pathname === filename);
        if (blob) {
          const response = await fetch(blob.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.statusText}`);
          }
          existingData = await response.json();
          console.log('Existing JSON data loaded for userId:', userId, 'Keys:', Object.keys(existingData.users));
        } else {
          console.log('No users.json found, creating new one');
          await put(filename, JSON.stringify({ users: {} }, null, 2), {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN
          });
          console.log('Created new users.json');
        }
      } catch (e) {
        console.error('Error checking existing JSON:', e);
        // Coba buat file baru jika gagal membaca
        await put(filename, JSON.stringify({ users: {} }, null, 2), {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN
        });
        console.log('Created new users.json after error');
      }

      // Perbarui data pengguna
      existingData.users[userId] = { points, history };

      // Simpan kembali ke Vercel Blob
      await put(filename, JSON.stringify(existingData, null, 2), {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });

      console.log('Data saved to JSON for userId:', userId, 'Points:', points);
      return res.json({ success: true });
    } catch (e) {
      console.error('Error saving data to JSON:', e);
      retries--;
      if (retries === 0) {
        return res.status(500).json({ success: false, error: e.message });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};