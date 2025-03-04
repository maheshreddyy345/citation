# Citation Generator

A modern web application for generating citations in various formats.

## Features (Phase 1)

- Support for books and website citations
- APA and MLA citation styles
- Real-time citation generation
- Copy to clipboard functionality
- Responsive design
- Multiple authors support for books

## Tech Stack

- Frontend: React with Material-UI
- Backend: Python Flask
- HTTP Client: Axios

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
```bash
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the Flask server:
```bash
python app.py
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. Select the source type (book or website)
2. Choose the citation style (APA or MLA)
3. Fill in the required fields
4. Click "Generate Citation"
5. Copy the generated citation using the copy button

## Next Steps

- Add more citation styles
- Support additional source types
- Implement URL/DOI auto-fill
- Add citation validation
- Enhance error handling
