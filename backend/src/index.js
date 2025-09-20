import express from 'express';
import cors from 'cors';
import shortUuid from 'short-uuid';
import useragent from 'express-useragent';
import geoip from 'geoip-lite';
import { connectDB, redisClient } from './db.js';
import Url from './models/Urls.js';
import Log from "logger"
import {LEVELS,STACKS,BOTH_PACKAGES,BACKEND_PACKAGES} from "logger/constant.js"

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(useragent.express());

connectDB();

app.post('/shorturls', async (req, res) => {
  const { url } = req.body;
  const validity = 30 * 60; 

  if (!url) {
    //stack,level,packagename,message
    Log(STACKS.BACKEND, LEVELS.ERROR, BOTH_PACKAGES.CONFIG, 'URL is required');
    return res.status(400).json({ error: 'URL is required' });
  }

  const shortCode = shortUuid.generate();
  const expiresAt = new Date(Date.now() + validity * 1000);

  try {
    const newUrl = new Url({
      originalUrl: url,
      shortCode,
      expiresAt,
    });
    await newUrl.save();

    await redisClient.set(shortCode, url, 'EX', validity);

    res.status(201).json({
      shortUrl: `http://localhost:4000/${shortCode}`,
      expiry: expiresAt.toISOString(),
    });
    Log(STACKS.BACKEND, LEVELS.INFO, BACKEND_PACKAGES.SERVICE, `Short URL created: ${shortCode}`);
  } catch (error) {
    Log(STACKS.BACKEND, LEVELS.ERROR, BACKEND_PACKAGES.SERVICE, `Error creating short URL: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const originalUrl = await redisClient.get(shortCode);

    if (originalUrl) {
      const urlDoc = await Url.findOne({ shortCode });
      if (urlDoc) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const geo = geoip.lookup(ip);

        urlDoc.clicks.push({
          ipAddress: ip,
          userAgent: req.get('User-Agent'),
          source: req.get('Referer') || 'Direct',
          geolocation: geo
            ? { country: geo.country, region: geo.region, city: geo.city }
            : {},
        });
        await urlDoc.save();
      }
      
      return res.redirect(originalUrl);
    }

    const urlDoc = await Url.findOne({ shortCode });

    if (urlDoc) {
      if (urlDoc.expiresAt && new Date() > urlDoc.expiresAt) {
        return res.status(404).json({ error: 'URL has expired' });
      }

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const geo = geoip.lookup(ip);

      urlDoc.clicks.push({
        ipAddress: ip,
        userAgent: req.get('User-Agent'),
        source: req.get('Referer') || 'Direct',
        geolocation: geo
          ? { country: geo.country, region: geo.region, city: geo.city }
          : {},
      });
      await urlDoc.save();

      await redisClient.set(shortCode, urlDoc.originalUrl, 'EX', 30 * 60);
      Log(STACKS.BACKEND, LEVELS.INFO, BACKEND_PACKAGES.SERVICE, `Redirecting to original URL for short code: ${shortCode}`);
      return res.redirect(urlDoc.originalUrl);
    }

    return res.status(404).json({ error: 'URL not found' });
  } catch (error) {
    Log(STACKS.BACKEND, LEVELS.ERROR, BACKEND_PACKAGES.SERVICE, `Error during redirection for short code ${shortCode}: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/shorturls/:shortcode', async (req, res) => {
    const { shortcode } = req.params;

    try {
        const urlDoc = await Url.findOne({ shortCode: shortcode });

        if (!urlDoc) {
          Log(STACKS.BACKEND, LEVELS.ERROR, BACKEND_PACKAGES.SERVICE, `URL not found for short code: ${shortCode}`);
            return res.status(404).json({ error: 'URL not found' });
        }

        res.json({
            totalClicks: urlDoc.clicks.length,
            originalUrl: urlDoc.originalUrl,
            creationDate: urlDoc.createdAt.toISOString(),
            expiryDate: urlDoc.expiresAt.toISOString(),
            clicks: urlDoc.clicks.map(click => ({
                timestamp: click.timestamp.toISOString(),
                source: click.source,
                geolocation: click.geolocation,
            })),
        });
        Log(STACKS.BACKEND, LEVELS.INFO, BACKEND_PACKAGES.SERVICE, `Fetched stats for short code: ${shortCode}`);
    } catch (error) {
        Log(STACKS.BACKEND, LEVELS.ERROR, BACKEND_PACKAGES.SERVICE, `Error fetching stats for short code ${shortCode}: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
});


app.listen(PORT, () => {
  Log(STACKS.BACKEND, LEVELS.INFO, BACKEND_PACKAGES.SERVICE, `Server is running on http://localhost:${PORT}`);
  console.log(`Server is running on http://localhost:${PORT}`);
});