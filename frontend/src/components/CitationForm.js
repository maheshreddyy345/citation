import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import axios from 'axios';

const CitationForm = ({ onCitationGenerated }) => {
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
      
      const response = await axios.post('http://localhost:5000/api/extract-metadata', { url });
      
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
      const response = await axios.post('http://localhost:5000/api/generate-citation', {
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
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
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

        {sourceType === 'website' && (
          <>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="URL *"
                value={formData.website.url}
                onChange={(e) => handleInputChange('website', 'url', e.target.value)}
                onBlur={handleUrlBlur}
                error={!!error}
                helperText={error}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              {loading && (
                <CircularProgress
                  size={24}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    marginTop: '-12px'
                  }}
                />
              )}
            </Box>
            <TextField
              fullWidth
              label="Title"
              value={formData.website.title}
              onChange={(e) => handleInputChange('website', 'title', e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Author"
              value={formData.website.author}
              onChange={(e) => handleInputChange('website', 'author', e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Date"
              value={formData.website.date}
              onChange={(e) => handleInputChange('website', 'date', e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Publisher/Website Name"
              value={formData.website.publisher}
              onChange={(e) => handleInputChange('website', 'publisher', e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />
          </>
        )}

        {sourceType === 'book' && (
          <>
            <TextField
              fullWidth
              label="Title"
              value={formData.book.title}
              onChange={(e) => handleInputChange('book', 'title', e.target.value)}
              sx={{ mb: 2 }}
            />
            {formData.book.authors.map((author, index) => (
              <TextField
                key={index}
                fullWidth
                label={`Author ${index + 1}`}
                value={author}
                onChange={(e) => handleInputChange('book', 'authors', e.target.value, index)}
                sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
            >
              Add Author
            </Button>
            <TextField
              fullWidth
              label="Year"
              value={formData.book.year}
              onChange={(e) => handleInputChange('book', 'year', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Publisher"
              value={formData.book.publisher}
              onChange={(e) => handleInputChange('book', 'publisher', e.target.value)}
              sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
            />
            {formData.journal.authors.map((author, index) => (
              <TextField
                key={index}
                fullWidth
                label={`Author ${index + 1}`}
                value={author}
                onChange={(e) => handleInputChange('journal', 'authors', e.target.value, index)}
                sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
            >
              Add Author
            </Button>
            <TextField
              fullWidth
              label="Journal Name"
              value={formData.journal.journal}
              onChange={(e) => handleInputChange('journal', 'journal', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Volume"
              value={formData.journal.volume}
              onChange={(e) => handleInputChange('journal', 'volume', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Issue"
              value={formData.journal.issue}
              onChange={(e) => handleInputChange('journal', 'issue', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Year"
              value={formData.journal.year}
              onChange={(e) => handleInputChange('journal', 'year', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Pages"
              value={formData.journal.pages}
              onChange={(e) => handleInputChange('journal', 'pages', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="DOI"
              value={formData.journal.doi}
              onChange={(e) => handleInputChange('journal', 'doi', e.target.value)}
              sx={{ mb: 2 }}
            />
          </>
        )}

        <LoadingButton
          type="submit"
          variant="contained"
          fullWidth
          loading={loading}
          sx={{ mt: 2 }}
        >
          Generate Citation
        </LoadingButton>
      </Box>
    </Paper>
  );
};

export default CitationForm;
