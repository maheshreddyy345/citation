import React, { useState, useEffect } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Container, 
  Box, 
  IconButton, 
  AppBar, 
  Toolbar, 
  Typography,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import CitationForm from './components/CitationForm';
import BatchCitationForm from './components/BatchCitationForm';
import CitationHistory from './components/CitationHistory';
import { getTheme } from './theme';

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`citation-tabpanel-${index}`}
      aria-labelledby={`citation-tab-${index}`}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  const [citations, setCitations] = useState(() => {
    const saved = localStorage.getItem('citationHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [tabValue, setTabValue] = useState(0);
  const theme = getTheme(mode);

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('citationHistory', JSON.stringify(citations));
  }, [citations]);

  const handleCitationGenerated = (citation) => {
    const newCitation = {
      text: citation,
      title: 'Citation ' + (citations.length + 1),
      timestamp: new Date().toISOString(),
    };
    setCitations(prev => [newCitation, ...prev].slice(0, 10));
  };

  const handleBatchCitationsGenerated = (newCitations) => {
    setCitations(prev => [...newCitations, ...prev].slice(0, 50));
  };

  const handleDeleteCitation = (index) => {
    setCitations(prev => prev.filter((_, i) => i !== index));
  };

  const handleCopyCitation = (citation) => {
    navigator.clipboard.writeText(citation.text);
  };

  const toggleColorMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Citation Generator
          </Typography>
          <IconButton onClick={toggleColorMode} color="inherit">
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="citation tabs"
              variant="fullWidth"
            >
              <Tab label="Single Citation" />
              <Tab label="Batch Citations" />
            </Tabs>
          </Paper>

          <TabPanel value={tabValue} index={0}>
            <CitationForm onCitationGenerated={handleCitationGenerated} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <BatchCitationForm onCitationsGenerated={handleBatchCitationsGenerated} />
          </TabPanel>

          <CitationHistory
            citations={citations}
            onDelete={handleDeleteCitation}
            onCopy={handleCopyCitation}
          />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
