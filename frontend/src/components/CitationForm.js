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
  useTheme
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
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

const CitationForm = ({ onCitationGenerated }) => {
  const theme = useTheme();
  const [sourceType, setSourceType] = useState('website');
  const [style, setStyle] = useState('APA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    website: {
      url: '',
      title: '',
      author: '',
      date: '',
      publisher: ''
    },
    book: {
      title: '',
      authors: [''],
      year: '',
      publisher: ''
    },
    journal: {
      title: '',
      authors: [''],
      journal: '',
      volume: '',
      issue: '',
      year: '',
      pages: '',
      doi: ''
    }
  });

  const handleInputChange = (sourceType, field, value, index = null) => {
    setFormData(prev => ({
      ...prev,
      [sourceType]: {
        ...prev[sourceType],
        [field]: index !== null && Array.isArray(prev[sourceType][field])
          ? prev[sourceType][field].map((item, i) => i === index ? value : item)
          : value
      }
    }));
  };

  const handleUrlBlur = async () => {
    let url = formData.website.url.trim();
    if (!url) return;

    // Add https:// if no protocol is specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      handleInputChange('website', 'url', url);
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_URL}/api/extract-metadata`, { url });
      
      if (response.data.error) {
        setError(response.data.error);
        return;
      }

      // Only update fields that have values
      const metadata = response.data;
      setFormData(prev => ({
        ...prev,
        website: {
          ...prev.website,
          url,
          title: metadata.title || prev.website.title,
          author: metadata.author || prev.website.author,
          date: metadata.date || prev.website.date,
          publisher: metadata.publisher || prev.website.publisher
        }
      }));
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to extract metadata';
      setError(errorMessage + '. Please fill in the details manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData[sourceType].url) {
      setError('Please enter a URL');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${API_URL}/api/generate-citation`, {
        sourceType,
        style,
        ...formData[sourceType]
      });
      
      if (response.data.error) {
        setError(response.data.error);
        return;
      }
      
      onCitationGenerated(response.data.citation);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error generating citation';
      setError(errorMessage + '. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <StyledPaper elevation={0}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1a237e' }}>
          Citation Generator
        </Typography>
        <Typography variant="body1" gutterBottom sx={{ color: 'text.secondary', mb: 4 }}>
          Generate accurate citations for your research in seconds
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Source Type</InputLabel>
            <Select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              label="Source Type"
            >
              <MenuItem value="website">Website</MenuItem>
              <MenuItem value="book">Book</MenuItem>
              <MenuItem value="journal">Journal</MenuItem>
            </Select>
          </FormControl>

          {sourceType === 'website' && (
            <TextField
              fullWidth
              label="Enter URL"
              variant="outlined"
              value={formData.website.url}
              onChange={(e) => handleInputChange('website', 'url', e.target.value)}
              onBlur={handleUrlBlur}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          )}

          {sourceType === 'book' && (
            <>
              <TextField
                fullWidth
                label="Title"
                value={formData.book.title}
                onChange={(e) => handleInputChange('book', 'title', e.target.value)}
                sx={{ mb: 3 }}
              />
              {formData.book.authors.map((author, index) => (
                <TextField
                  key={index}
                  fullWidth
                  label={`Author ${index + 1}`}
                  value={author}
                  onChange={(e) => handleInputChange('book', 'authors', e.target.value, index)}
                  sx={{ mb: 3 }}
                />
              ))}
              <Button
                variant="outlined"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  book: {
                    ...prev.book,
                    authors: [...prev.book.authors, '']
                  }
                }))}
                sx={{ mb: 3 }}
              >
                Add Author
              </Button>
              <TextField
                fullWidth
                label="Year"
                value={formData.book.year}
                onChange={(e) => handleInputChange('book', 'year', e.target.value)}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Publisher"
                value={formData.book.publisher}
                onChange={(e) => handleInputChange('book', 'publisher', e.target.value)}
                sx={{ mb: 3 }}
              />
            </>
          )}

          {sourceType === 'journal' && (
            <>
              <TextField
                fullWidth
                label="Title"
                value={formData.journal.title}
                onChange={(e) => handleInputChange('journal', 'title', e.target.value)}
                sx={{ mb: 3 }}
              />
              {formData.journal.authors.map((author, index) => (
                <TextField
                  key={index}
                  fullWidth
                  label={`Author ${index + 1}`}
                  value={author}
                  onChange={(e) => handleInputChange('journal', 'authors', e.target.value, index)}
                  sx={{ mb: 3 }}
                />
              ))}
              <Button
                variant="outlined"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  journal: {
                    ...prev.journal,
                    authors: [...prev.journal.authors, '']
                  }
                }))}
                sx={{ mb: 3 }}
              >
                Add Author
              </Button>
              <TextField
                fullWidth
                label="Journal Name"
                value={formData.journal.journal}
                onChange={(e) => handleInputChange('journal', 'journal', e.target.value)}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Volume"
                value={formData.journal.volume}
                onChange={(e) => handleInputChange('journal', 'volume', e.target.value)}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Issue"
                value={formData.journal.issue}
                onChange={(e) => handleInputChange('journal', 'issue', e.target.value)}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Year"
                value={formData.journal.year}
                onChange={(e) => handleInputChange('journal', 'year', e.target.value)}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Pages"
                value={formData.journal.pages}
                onChange={(e) => handleInputChange('journal', 'pages', e.target.value)}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="DOI"
                value={formData.journal.doi}
                onChange={(e) => handleInputChange('journal', 'doi', e.target.value)}
                sx={{ mb: 3 }}
              />
            </>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
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

          <StyledButton
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Citation'}
          </StyledButton>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default CitationForm;
