import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  useTheme,
  Divider
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.08)',
  background: '#ffffff',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: '10px 24px',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
}));

const API_URL = process.env.REACT_APP_API_URL;

const BatchCitationForm = ({ onCitationsGenerated }) => {
  const theme = useTheme();
  const [style, setStyle] = useState('APA');
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [citations, setCitations] = useState([]);
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
    setCitations([]);
    setProgress(0);

    try {
      const results = [];
      let completed = 0;

      for (const url of urlList) {
        try {
          // First get metadata
          const metadataResponse = await axios.post(`${API_URL}/api/extract-metadata`, { url });
          
          if (metadataResponse.data.error) {
            results.push({
              url,
              error: metadataResponse.data.error,
              success: false
            });
            continue;
          }

          // Then generate citation
          const citationResponse = await axios.post(`${API_URL}/api/generate-citation`, {
            sourceType: 'website',
            style,
            url,
            ...metadataResponse.data
          });

          results.push({
            url,
            citation: citationResponse.data.citation,
            metadata: metadataResponse.data,
            success: true
          });

        } catch (error) {
          results.push({
            url,
            error: error.response?.data?.error || error.message,
            success: false
          });
        }

        completed++;
        setProgress((completed / urlList.length) * 100);
      }

      const citations = results.filter(result => result.success).map(result => result.citation);
      setCitations(citations);
      onCitationsGenerated(citations.map(citation => ({
        text: citation,
        title: '',
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

  const handleCopyAll = () => {
    navigator.clipboard.writeText(citations.join('\n'));
  };

  return (
    <Container maxWidth="md">
      <StyledPaper elevation={0}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1a237e' }}>
          Batch Citation Generator
        </Typography>
        <Typography variant="body1" gutterBottom sx={{ color: 'text.secondary', mb: 4 }}>
          Generate multiple citations at once - perfect for bibliography creation
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Enter URLs (one per line)"
            variant="outlined"
            multiline
            rows={4}
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <FormatListBulletedIcon sx={{ mt: 1, mr: 1, color: 'text.secondary' }} />,
            }}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Citation Style</InputLabel>
            <Select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              label="Citation Style"
            >
              <MenuItem value="APA">APA</MenuItem>
              <MenuItem value="MLA">MLA</MenuItem>
              <MenuItem value="Chicago">Chicago</MenuItem>
              <MenuItem value="Harvard">Harvard</MenuItem>
            </Select>
          </FormControl>

          <StyledButton
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Citations'}
          </StyledButton>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {citations.length > 0 && (
            <StyledCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                    Generated Citations
                  </Typography>
                  <Tooltip title="Copy all citations">
                    <IconButton onClick={handleCopyAll} size="small">
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {citations.map((citation, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" component="div" sx={{ flex: 1, pr: 2 }}>
                        {citation}
                      </Typography>
                      <Tooltip title="Copy citation">
                        <IconButton 
                          onClick={() => handleCopy(citation)} 
                          size="small"
                          sx={{ color: theme.palette.primary.main }}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {index < citations.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))}
              </CardContent>
            </StyledCard>
          )}
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default BatchCitationForm;
