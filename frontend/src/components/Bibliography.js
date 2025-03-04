import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Bibliography = ({ onSelectBibliography }) => {
  const [bibliographies, setBibliographies] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBibName, setNewBibName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBibliographies();
  }, []);

  const fetchBibliographies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bibliography', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBibliographies(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching bibliographies:', error);
      setError('Failed to fetch bibliographies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBibliography = async () => {
    if (!newBibName.trim()) {
      setError('Bibliography name is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/bibliography', 
        { name: newBibName },
        { 
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setBibliographies([...bibliographies, response.data]);
      setDialogOpen(false);
      setNewBibName('');
      setError('');
    } catch (error) {
      console.error('Error creating bibliography:', error);
      setError('Failed to create bibliography');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (bibId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/export-bibliography/${bibId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const element = document.createElement('a');
      const file = new Blob([response.data.citations], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${response.data.name}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error exporting bibliography:', error);
      setError('Failed to export bibliography');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">My Bibliographies</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          disabled={loading}
        >
          New Bibliography
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <List>
        {bibliographies.map((bib) => (
          <ListItem
            key={bib.id}
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              mb: 1,
            }}
          >
            <ListItemText
              primary={bib.name}
              secondary={`${bib.citation_count} citations • Last updated: ${new Date(
                bib.updated_at
              ).toLocaleDateString()}`}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => onSelectBibliography(bib)}
                sx={{ mr: 1 }}
              >
                <ViewIcon />
              </IconButton>
              <IconButton edge="end" onClick={() => handleExport(bib.id)}>
                <DownloadIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Create New Bibliography</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Bibliography Name"
            fullWidth
            value={newBibName}
            onChange={(e) => setNewBibName(e.target.value)}
            error={!newBibName.trim() && error === 'Bibliography name is required'}
            helperText={!newBibName.trim() && error === 'Bibliography name is required' ? 'This field is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false);
            setError('');
            setNewBibName('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateBibliography}
            disabled={!newBibName.trim() || loading}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Bibliography;
