const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  const { userId } = req.body;

  try {
    // Nama file JSON
    const filename = 'users.json';

    // Ambil file JSON
    let data = null;
    const blobs = await list();
    const blob = blobs.blobs.find(b => b.pathname === filename);
    if (blob) {
      const response = await fetch(blob.url);
      const jsonData = await response.json();
      data = jsonData.users[userId];
    }

    if (data) {
      res.json({ success: true, data });
    } else {
      res.json({ success: false, error: 'No data found' });
    }
  } catch (e) {
    console.error('Error loading data from JSON:', e);
    res.json({ success: false, error: e.message });
  }
};