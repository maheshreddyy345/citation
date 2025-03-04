import React from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  Snackbar,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const CitationResult = ({ citation }) => {
  const [open, setOpen] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(citation);
    setOpen(true);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Generated Citation
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'grey.100',
          p: 2,
          borderRadius: 1,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontStyle: 'italic',
            flex: 1,
            mr: 2,
          }}
        >
          {citation}
        </Typography>
        <IconButton onClick={handleCopy} color="primary">
          <ContentCopyIcon />
        </IconButton>
      </Box>
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={() => setOpen(false)}
        message="Citation copied to clipboard"
      />
    </Paper>
  );
};

export default CitationResult;
