export default async function handler(req, res) {
  try {
    // Fetch some data or perform logic to determine rules
    const shouldBlockAll = await someCondition(); 

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Cache for 1 hour

    if (shouldBlockAll) {
      res.send(`User-agent: *
Disallow: /`);
    } else {
      res.send(`User-agent: *
Disallow: /private/`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating robots.txt');
  }
}
