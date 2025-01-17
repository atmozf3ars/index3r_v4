import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { setInterval } from 'timers';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = 3000;

const whitelist = [
  '86.92.129.223',
  '83.87.219.236',
  '120.88.138.117',
  '217.255.164.94',
  '77.170.163.104',
  '31.54.216.59',
  '86.92.34.212',
  '82.101.233.34',
  '94.209.166.160',
  '62.45.117.240',
  '77.250.239.103',
  '77.169.205.52',
  '92.109.32.21',
  '2.248.130.54',
  '84.115.231.35',
  '71.175.72.200'
];
const ipRange = {
  start: '192.168.2.1',
  end: '192.168.2.255'
};

// Function to color the filepath
function colorFilePath(filepath) {
  const parts = filepath.split('/');
  return parts.map((part, index) => {
    const colors = [chalk.yellow, chalk.green, chalk.blue, chalk.magenta, chalk.cyan];
    return colors[index % colors.length](part);
  }).join('/');
}

// Function to get the real IP address
function getRealIp(req) {
  return req.headers['x-real-ip'] ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.socket.remoteAddress;
}

const ipToLong = (ip) => {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
};

const isIpInRange = (ip, start, end) => {
  const ipLong = ipToLong(ip);
  const startLong = ipToLong(start);
  const endLong = ipToLong(end);
  return ipLong >= startLong && ipLong <= endLong;
};

const isIpAllowed = (ip) => {
  return whitelist.includes(ip) || isIpInRange(ip, ipRange.start, ipRange.end);
};

// Updated function to check if the path is publicly accessible
const isPublicPath = (url) => {
  return url.startsWith('/media-gallery/') ||
         url.startsWith('/download/') ||
         url.startsWith('/thumbnails/') ||
         url.startsWith('/_next/static/css/') ||
         url.startsWith('/_next/static/chunks/') ||
         url.startsWith('/_next/webpack-hmr') ||
         url.startsWith('/api/') ||
         url.startsWith('/_next/image?url=');
};

const suspiciousIPs = new Set();

const flushInterval = 5 * 60 * 1000; // 5 minutes

setInterval(async () => {
  if (suspiciousIPs.size > 0) {
    const logPath = path.join('O:\\', 'innercircle-indexer', 'iplist.json');
    try {
      const data = Array.from(suspiciousIPs).join('\n');
      await fs.writeFile(logPath, data);
      console.log(`Flushed ${suspiciousIPs.size} suspicious IP entries to log file`);
    } catch (error) {
      console.error(`Error flushing suspicious IPs to log file: ${error}`);
    }
  }
}, flushInterval);

async function logSuspiciousIP(ip, url) {
  const logEntry = `${ip} | tried accessing "${url}"`;
  suspiciousIPs.add(logEntry);
  const logPath = path.join('O:\\', 'innercircle-indexer', 'suspiciousips.list');
  console.log(`Attempting to log suspicious IP: ${logEntry}`);
  try {
    const data = Array.from(suspiciousIPs).join('\n');
    await fs.writeFile(logPath, data);
    console.log(`Successfully logged suspicious IP: ${logEntry}`);
  } catch (error) {
    console.error(`Error writing to log file: ${error}`);
    console.error(`Attempted to write to: ${logPath}`);
    console.error(`Current working directory: ${process.cwd()}`);
  }
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);

    // IP logging middleware
    const ipAddress = getRealIp(req);

    // Check for suspicious requests
    if (req.url.startsWith('/.env') ||
        req.url.startsWith('/cgi-bin/') ||
        req.url.startsWith('/wp') ||
        req.url.toLowerCase().includes('admin') ||
        req.url === '/') {
      logSuspiciousIP(ipAddress, req.url);
    }

    // Check if the path is public or if the IP is whitelisted
    if (!isPublicPath(req.url) && !isIpAllowed(ipAddress)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('DENIED');
      console.log(
        `${chalk.bold(ipAddress)} - ` +
        `${chalk.cyan(req.method)} ${colorFilePath(req.url)} ` +
        `${chalk.red(403)} (Blocked)`
      );
      return;
    }

    // Wrap the handle function to log the status code after the response is sent
    const wrappedHandle = (req, res, parsedUrl) => {
      const originalEnd = res.end;
      res.end = function(...args) {
        const statusColor = res.statusCode < 400 ? chalk.green : chalk.red;
        console.log(
          `${chalk.bold(ipAddress)} - ` +
          `${chalk.cyan(req.method)} ${colorFilePath(req.url)} ` +
          `${statusColor(res.statusCode)}`
        );
        return originalEnd.apply(this, args);
      };
      return handle(req, res, parsedUrl);
    };

    wrappedHandle(req, res, parsedUrl);
  }).listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(chalk.blue(`> Next.js server ready on http://0.0.0.0:${PORT}`));
    console.log(chalk.blue('> Caddy reverse proxy will serve:'));
    console.log(chalk.white('> Suspicious IPs are logged'));
    console.log(chalk.green('  - HTTP on port 80'));
    console.log(chalk.green('  - HTTPS on port 443'));
    console.log(chalk.yellow('> IP Whitelisting is active. Allowed IPs:'));
    whitelist.forEach(ip => console.log(chalk.yellow(`  - ${ip}`)));
    console.log(chalk.yellow(`> Allowed IP range: ${ipRange.start} to ${ipRange.end}`));
    console.log(chalk.green('> Public paths (accessible to all):'));
    console.log(chalk.green('  - /media-gallery/ (the media gallery page, public)'));
    console.log(chalk.green('  - /download/ (the download file page, external)'));
    console.log(chalk.green('  - /_next/static/css/ (styling)'));
    console.log(chalk.green('  - /_next/static/chunks/ (node server next build export)'));
    console.log(chalk.green('  - /_next/ some thumbnails, images and api calls'));
    console.log(chalk.green('  - /api/'));
  });
});

