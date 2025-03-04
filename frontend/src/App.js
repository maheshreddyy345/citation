import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Button, Box, Container, Typography } from '@mui/material';
import CitationForm from './components/CitationForm';
import BatchCitationForm from './components/BatchCitationForm';
import CitationHistory from './components/CitationHistory';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e',
      light: '#534bae',
      dark: '#000051',
    },
    background: {
      default: '#f5f5f7',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

function App() {
  const [citations, setCitations] = useState(() => {
    const saved = localStorage.getItem('citationHistory');
    return saved ? JSON.parse(saved) : [];
  });

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

  useEffect(() => {
    localStorage.setItem('citationHistory', JSON.stringify(citations));
  }, [citations]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="sticky" color="transparent">
          <Container maxWidth="lg">
            <Toolbar sx={{ px: { xs: 0 } }}>
              <Typography 
                variant="h6" 
                component={Link} 
                to="/" 
                sx={{ 
                  color: 'primary.main', 
                  textDecoration: 'none',
                  fontWeight: 700,
                  flexGrow: 1 
                }}
              >
                Citation Generator
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  component={Link}
                  to="/"
                  color="primary"
                  sx={{ fontWeight: 500 }}
                >
                  Single Citation
                </Button>
                <Button
                  component={Link}
                  to="/batch"
                  color="primary"
                  variant="contained"
                  sx={{ fontWeight: 500 }}
                >
                  Batch Citations
                </Button>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        <Box sx={{ py: 4 }}>
          <Routes>
            <Route path="/" element={<CitationForm onCitationGenerated={handleCitationGenerated} />} />
            <Route path="/batch" element={<BatchCitationForm onCitationsGenerated={handleBatchCitationsGenerated} />} />
          </Routes>
          <CitationHistory
            citations={citations}
            onDelete={handleDeleteCitation}
            onCopy={handleCopyCitation}
          />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
