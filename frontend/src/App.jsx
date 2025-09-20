import  { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import Log from "logger"
import {LEVELS,STACKS,BOTH_PACKAGES,FRONTEND_PACKAGES} from "logger/constant.js"



function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}


function AnalyticsDisplay({ data }) {
  if (!data){
    //stack,level,packagename,message
    Log(STACKS.FRONTEND, LEVELS.ERROR, FRONTEND_PACKAGES.COMPONENT, 'No analytics data available');
    return null
  };
  
  Log(STACKS.FRONTEND, LEVELS.INFO, FRONTEND_PACKAGES.COMPONENT, 'Displaying analytics data');
  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Analytics Results
        </Typography>
        <Typography>
          <strong>Original URL:</strong>{' '}
          <Link href={data.originalUrl} target="_blank" rel="noopener">
            {data.originalUrl}
          </Link>
        </Typography>
        <Typography>
          <strong>Total Clicks:</strong> {data.totalClicks}
        </Typography>
        <Typography>
          <strong>Created At:</strong> {new Date(data.creationDate).toLocaleString()}
        </Typography>
        <Typography>
          <strong>Expires At:</strong> {new Date(data.expiryDate).toLocaleString()}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Click Details
        </Typography>
        {data.clicks.length > 0 ? (
          <List>
            {data.clicks.map((click, index) => (
              <ListItem key={index} disableGutters>
                <ListItemText
                  primary={`Clicked at: ${new Date(click.timestamp).toLocaleString()}`}
                  secondary={`Source: ${click.source} | Location: ${
                    click.geolocation?.city || 'N/A'
                  }, ${click.geolocation?.country || 'N/A'}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No clicks recorded yet.</Typography>
        )}
      </CardContent>
    </Card>
  );
}

function App() {
  
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [expiry, setExpiry] = useState('');
  const [shortenLoading, setShortenLoading] = useState(false);
  const [shortenError, setShortenError] = useState('');


  const [analyticsCode, setAnalyticsCode] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');


  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleShortenSubmit = async (e) => {
    e.preventDefault();
    setShortenLoading(true);
    setShortenError('');
    setShortUrl('');
    setExpiry('');

    try {
      const response = await fetch('http://localhost:4000/shorturls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        const errData = await response.json();
       Log(STACKS.FRONTEND, LEVELS.ERROR, FRONTEND_PACKAGES.COMPONENT, `Error shortening URL: ${errData.error || 'Unknown error'}`);
      }
      const data = await response.json();
      Log(STACKS.FRONTEND, LEVELS.INFO, FRONTEND_PACKAGES.COMPONENT, `URL shortened successfully: ${data.shortUrl}`);
      setShortUrl(data.shortUrl);
      setExpiry(data.expiry);
    } catch (err) {
      Log(STACKS.FRONTEND, LEVELS.ERROR, FRONTEND_PACKAGES.COMPONENT, `Exception shortening URL: ${err.message}`);
      setShortenError(err.message);
    } finally {
      setShortenLoading(false);
    }
  };

  const handleAnalyticsSubmit = async (e) => {
    e.preventDefault();
    setAnalyticsLoading(true);
    setAnalyticsError('');
    setAnalyticsData(null);

    
    let code = analyticsCode;
    if (analyticsCode.includes('/')) {
        code = analyticsCode.split('/').pop();
    }


    try {
      const response = await fetch(`http://localhost:4000/shorturls/${code}`);
      if (!response.ok) {
        
        const errData = await response.json();
        Log(STACKS.FRONTEND, LEVELS.ERROR, FRONTEND_PACKAGES.COMPONENT, `Error fetching analytics: ${errData.error || 'Unknown error'}`);
      }
      const data = await response.json();
      setAnalyticsData(data);
      Log(STACKS.FRONTEND, LEVELS.INFO, FRONTEND_PACKAGES.COMPONENT, `Analytics data fetched successfully for code: ${code}`);
    } catch (err) {
      setAnalyticsError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  Log(STACKS.FRONTEND, LEVELS.INFO, FRONTEND_PACKAGES.COMPONENT, 'Rendering App component');

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          URL Shortener & Analytics
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Shorten URL" />
            <Tab label="View Analytics" />
          </Tabs>
        </Box>

        
        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={handleShortenSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="url"
              label="Enter a long URL to shorten"
              name="url"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={shortenLoading}>
              {shortenLoading ? <CircularProgress size={24} /> : 'Shorten'}
            </Button>
          </Box>
          {shortenError && <Typography color="error" sx={{ mt: 2 }}>{shortenError}</Typography>}
          {shortUrl && (
            <Card sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h6">Your Shortened URL:</Typography>
                <Link href={shortUrl} target="_blank" rel="noopener">{shortUrl}</Link>
                <Typography sx={{ mt: 2 }}>Expires at: {new Date(expiry).toLocaleString()}</Typography>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        
        <TabPanel value={tabValue} index={1}>
          <Box component="form" onSubmit={handleAnalyticsSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="analytics-code"
              label="Enter Short Code or Short URL"
              name="analytics-code"
              autoFocus
              value={analyticsCode}
              onChange={(e) => setAnalyticsCode(e.target.value)}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={analyticsLoading}>
              {analyticsLoading ? <CircularProgress size={24} /> : 'Get Analytics'}
            </Button>
          </Box>
          {analyticsError && <Typography color="error" sx={{ mt: 2 }}>{analyticsError}</Typography>}
          {analyticsData && <AnalyticsDisplay data={analyticsData} />}
        </TabPanel>
      </Box>
    </Container>
  );
}

export default App;