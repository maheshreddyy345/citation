import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Divider,
  useTheme
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const CitationHistory = ({ citations, onDelete, onCopy }) => {
  const theme = useTheme();

  if (!citations || citations.length === 0) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mt: 3,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <HistoryIcon color="disabled" />
          <Typography variant="body2" color="text.secondary">
            No citation history yet
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ mt: 3 }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon fontSize="small" />
          Recent Citations
        </Typography>
      </Box>
      <List>
        {citations.map((citation, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemText
                primary={citation.title || 'Untitled Citation'}
                secondary={
                  <Typography
                    component="div"
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {citation.text}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="Copy citation">
                  <IconButton edge="end" aria-label="copy" onClick={() => onCopy(citation)} sx={{ mr: 1 }}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete from history">
                  <IconButton edge="end" aria-label="delete" onClick={() => onDelete(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
            {index < citations.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default CitationHistory;
