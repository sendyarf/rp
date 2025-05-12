const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.error('Missing userId in request body');
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }

  try {
    const filename = 'users.json';
    let data = null;

    const blobs = await list();
    const blob = blobs.blobs.find(b => b.pathname === filename);
    if (blob) {
      const response = await fetch(blob.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
      }
      const jsonData = await response.json();
      data = jsonData.users && jsonData.users[userId];
      console.log('Data loaded for userId:', userId, 'Data:', data);
    } else {
      console.log('No users.json file found');
    }

    if (data) {
      res.setHeader('Cache-Control', 'no-cache');
      res.json({ success: true, data });
    } else {
      console.log('No data found for userId:', userId);
      res.json({ success: false, error: 'No data found' });
    }
  } catch (e) {
    console.error('Error loading data from JSON:', e);
    res.status(500).json({ success: false, error: e.message });
  }
};