import React, { useState } from 'react';
import {
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import axios from 'axios';

const BatchCitationForm = ({ onCitationsGenerated }) => {
  const [style, setStyle] = useState('APA');
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);

  const handleUrlsChange = (e) => {
    setUrls(e.target.value);
  };

  const processUrls = (text) => {
    return text
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const urlList = processUrls(urls);
    
    if (urlList.length === 0) {
      setError('Please enter at least one URL');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setProgress(0);

    try {
      const citations = [];
      let completed = 0;

      for (const url of urlList) {
        try {
          // First get metadata
          const metadataResponse = await axios.post('http://localhost:5000/api/extract-metadata', { url });
          
          if (metadataResponse.data.error) {
            citations.push({
              url,
              error: metadataResponse.data.error,
              success: false
            });
            continue;
          }

          // Then generate citation
          const citationResponse = await axios.post('http://localhost:5000/api/generate-citation', {
            sourceType: 'website',
            style,
            url,
            ...metadataResponse.data
          });

          citations.push({
            url,
            citation: citationResponse.data.citation,
            metadata: metadataResponse.data,
            success: true
          });

        } catch (error) {
          citations.push({
            url,
            error: error.response?.data?.error || error.message,
            success: false
          });
        }

        completed++;
        setProgress((completed / urlList.length) * 100);
      }

      setResults(citations);
      onCitationsGenerated(citations.filter(c => c.success).map(c => ({
        text: c.citation,
        title: c.metadata?.title || c.url,
        timestamp: new Date().toISOString()
      })));

    } catch (error) {
      setError('Failed to process URLs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (citation) => {
    navigator.clipboard.writeText(citation);
  };

  const handleExport = () => {
    const text = results
      .map(result => result.success 
        ? `${result.url}\n${result.citation}\n` 
        : `${result.url}\nError: ${result.error}\n`)
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'citations.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Batch Citation Generator
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter multiple URLs (one per line) to generate citations in bulk
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Citation Style</InputLabel>
          <Select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            label="Citation Style"
          >
            <MenuItem value="APA">APA 7th Edition</MenuItem>
            <MenuItem value="MLA">MLA 9th Edition</MenuItem>
            <MenuItem value="Chicago">Chicago 17th Edition</MenuItem>
            <MenuItem value="Harvard">Harvard</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="URLs (one per line)"
          value={urls}
          onChange={handleUrlsChange}
          error={!!error}
          helperText={error}
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={loading}
            startIcon={<UploadIcon />}
            sx={{ flex: 1 }}
          >
            Generate Citations
          </LoadingButton>
          {results.length > 0 && (
            <Button
              variant="outlined"
              onClick={handleExport}
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
          )}
        </Box>

        {loading && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Processing URLs... {Math.round(progress)}%
            </Typography>
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          </Box>
        )}

        {results.length > 0 && (
          <List>
            {results.map((result, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={result.success ? 'Success' : 'Error'}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {result.url}
                        </Typography>
                        <Typography
                          variant="body1"
                          color={result.success ? 'text.primary' : 'error'}
                          sx={{ mt: 1 }}
                        >
                          {result.success ? result.citation : result.error}
                        </Typography>
                      </Box>
                    }
                  />
                  {result.success && (
                    <ListItemSecondaryAction>
                      <Tooltip title="Copy citation">
                        <IconButton
                          edge="end"
                          onClick={() => handleCopy(result.citation)}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                {index < results.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default BatchCitationForm;
