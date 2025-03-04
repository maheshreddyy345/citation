from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup, Tag
from datetime import datetime
import validators
from dateutil import parser
import urllib3
import json
from urllib.parse import urlparse
from citation_rules import get_citation_rules, validate_citation, format_citation

# Disable SSL verification warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

def extract_metadata(url):
    try:
        if not validators.url(url):
            print(f"Invalid URL format: {url}")
            return None
            
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive'
        }
        
        print(f"Fetching URL: {url}")
        response = requests.get(url, headers=headers, verify=False, timeout=10)
        
        if response.status_code != 200:
            print(f"Request failed with status code: {response.status_code}")
            return None
            
        print("Parsing content...")
        soup = BeautifulSoup(response.text, 'html.parser')
        
        metadata = {
            'title': '',
            'author': '',
            'date': '',
            'publisher': ''
        }
        
        # Try JSON-LD first (most reliable when available)
        json_ld = soup.find('script', {'type': 'application/ld+json'})
        if json_ld:
            try:
                data = json.loads(json_ld.string)
                if isinstance(data, list):
                    data = data[0]
                print("Found JSON-LD data")
                
                metadata['title'] = data.get('headline', '') or data.get('name', '')
                metadata['date'] = data.get('datePublished', '') or data.get('dateCreated', '')
                
                author = data.get('author', {})
                if isinstance(author, list):
                    author = author[0]
                metadata['author'] = author.get('name', '') if isinstance(author, dict) else str(author)
                
                publisher = data.get('publisher', {})
                metadata['publisher'] = publisher.get('name', '') if isinstance(publisher, dict) else str(publisher)
            except Exception as e:
                print(f"Error parsing JSON-LD: {e}")
        
        # Fallback to meta tags if needed
        if not metadata['title']:
            # Try meta tags first
            meta_title = (
                soup.find('meta', {'property': 'og:title'}) or
                soup.find('meta', {'name': 'title'}) or
                soup.find('meta', {'name': 'twitter:title'})
            )
            if meta_title:
                metadata['title'] = meta_title.get('content', '')
            # Fallback to title tag
            elif soup.title:
                metadata['title'] = soup.title.string
            # Last resort: h1
            elif soup.find('h1'):
                metadata['title'] = soup.find('h1').get_text()
        
        if not metadata['author']:
            meta_author = (
                soup.find('meta', {'property': 'article:author'}) or
                soup.find('meta', {'name': 'author'}) or
                soup.find('meta', {'property': 'og:article:author'})
            )
            if meta_author:
                metadata['author'] = meta_author.get('content', '')
        
        if not metadata['date']:
            meta_date = (
                soup.find('meta', {'property': 'article:published_time'}) or
                soup.find('meta', {'name': 'date'}) or
                soup.find('time', {'datetime': True})
            )
            if meta_date:
                date_str = meta_date.get('content', '') or meta_date.get('datetime', '')
                try:
                    parsed_date = parser.parse(date_str)
                    metadata['date'] = parsed_date.strftime('%Y, %B %d')
                except Exception as e:
                    print(f"Error parsing date: {e}")
        
        if not metadata['publisher']:
            meta_publisher = (
                soup.find('meta', {'property': 'og:site_name'}) or
                soup.find('meta', {'name': 'publisher'})
            )
            if meta_publisher:
                metadata['publisher'] = meta_publisher.get('content', '')
            else:
                # Use domain name as fallback
                domain = urlparse(url).netloc
                metadata['publisher'] = domain.replace('www.', '')
        
        # Clean up the metadata
        for key in metadata:
            if metadata[key]:
                # Remove extra whitespace and newlines
                metadata[key] = ' '.join(metadata[key].split())
                # Remove common website suffixes from title
                if key == 'title':
                    parts = metadata[key].split(' - ')
                    metadata[key] = parts[0].strip()
                    # If we don't have a publisher and there's a suffix, use it
                    if not metadata['publisher'] and len(parts) > 1:
                        metadata['publisher'] = parts[-1].strip()
        
        print(f"Extracted metadata: {metadata}")
        return metadata
        
    except Exception as e:
        print(f"Error extracting metadata: {e}")
        return None

@app.route('/api/extract-metadata', methods=['POST'])
def extract_url_metadata():
    try:
        data = request.json
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
            
        print(f"Processing URL: {url}")
        metadata = extract_metadata(url)
        
        if metadata is None:
            return jsonify({'error': 'Failed to extract metadata. Please fill in the details manually.'}), 400
            
        return jsonify(metadata)
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/batch-extract-metadata', methods=['POST'])
def batch_extract_metadata():
    try:
        data = request.json
        urls = data.get('urls', [])
        
        if not urls:
            return jsonify({'error': 'No URLs provided'}), 400
            
        results = []
        for url in urls:
            try:
                metadata = extract_metadata(url)
                if metadata:
                    results.append({
                        'url': url,
                        'metadata': metadata,
                        'success': True
                    })
                else:
                    results.append({
                        'url': url,
                        'error': 'Failed to extract metadata',
                        'success': False
                    })
            except Exception as e:
                results.append({
                    'url': url,
                    'error': str(e),
                    'success': False
                })
                
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/generate-citation', methods=['POST'])
def generate_citation():
    data = request.json
    source_type = data.get('sourceType')
    style = data.get('style')
    
    try:
        if source_type == 'book':
            citation_text = format_book_citation(data, style)
        elif source_type == 'website':
            citation_text = format_website_citation(data, style)
        elif source_type == 'journal':
            citation_text = format_journal_citation(data, style)
        else:
            return jsonify({'error': 'Unsupported source type'}), 400
            
        return jsonify({
            'citation': citation_text,
            'style': style,
            'sourceType': source_type
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/batch-generate-citations', methods=['POST'])
def batch_generate_citations():
    try:
        data = request.json
        items = data.get('items', [])
        style = data.get('style', 'APA')
        
        if not items:
            return jsonify({'error': 'No items provided'}), 400
            
        results = []
        for item in items:
            try:
                if item.get('sourceType') == 'website':
                    citation = format_website_citation(item, style)
                elif item.get('sourceType') == 'book':
                    citation = format_book_citation(item, style)
                elif item.get('sourceType') == 'journal':
                    citation = format_journal_citation(item, style)
                else:
                    citation = None
                    
                if citation:
                    results.append({
                        'citation': citation,
                        'success': True
                    })
                else:
                    results.append({
                        'error': 'Failed to generate citation',
                        'success': False
                    })
            except Exception as e:
                results.append({
                    'error': str(e),
                    'success': False
                })
                
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

def format_website_citation(data, style):
    # Validate citation data
    validation = validate_citation(data, style, 'website')
    if not validation['valid']:
        return f"Error: {', '.join(validation['errors'])}"

    # Get citation rules
    rules = get_citation_rules(style, 'website')
    if not rules:
        return "Citation style not supported"

    # Clean and format data according to rules
    formatted_data = {
        'author': data.get('author', ''),
        'date': data.get('date', ''),
        'title': data.get('title', ''),
        'publisher': data.get('publisher', ''),
        'url': data.get('url', '')
    }

    # Format author according to style
    if formatted_data['author']:
        if style == 'APA':
            # APA: Last, F. M.
            names = formatted_data['author'].split()
            if len(names) > 1:
                formatted_data['author'] = f"{names[-1]}, {' '.join(n[0] + '.' for n in names[:-1])}"
        elif style == 'MLA':
            # MLA: Last, First Middle
            names = formatted_data['author'].split()
            if len(names) > 1:
                formatted_data['author'] = f"{names[-1]}, {' '.join(names[:-1])}"

    # Format date according to style
    if formatted_data['date']:
        try:
            date_obj = parser.parse(formatted_data['date'])
            if style == 'APA':
                formatted_data['date'] = date_obj.strftime('%Y')
            elif style == 'MLA':
                formatted_data['date'] = date_obj.strftime('%d %b. %Y')
        except:
            pass  # Keep original date format if parsing fails

    # Format title according to style
    if formatted_data['title']:
        if style == 'APA':
            # APA: Only capitalize first word
            formatted_data['title'] = formatted_data['title'].capitalize()
        elif style == 'MLA':
            # MLA: Title case
            formatted_data['title'] = ' '.join(word.capitalize() for word in formatted_data['title'].split())

    # Use the citation formatter
    citation = format_citation(formatted_data, style, 'website')
    return citation if citation else "Error formatting citation"

def format_book_citation(data, style):
    authors = data.get('authors', [])
    title = data.get('title', '')
    year = data.get('year', '')
    publisher = data.get('publisher', '')
    
    if style == 'APA':
        # APA 7th edition format for books:
        # Author, A. A. (Year). Title (in italics). Publisher.
        
        # Format authors
        if len(authors) > 1:
            authors_str = ', '.join(authors[:-1]) + ', & ' + authors[-1]
        else:
            authors_str = authors[0] if authors else ''
            
        # Build citation
        citation = f"{authors_str}"
        if year:
            citation += f" ({year})"
        citation += f". {title}"  # Note: Title should be italicized in actual display
        if publisher:
            citation += f". {publisher}"
        citation += "."
        
        return citation
        
    else:  # MLA 9th edition
        # MLA format for books:
        # Author(s). Title (in italics). Publisher, Year.
        
        # Format authors
        if len(authors) > 2:
            authors_str = ', '.join(authors[:-1]) + ', and ' + authors[-1]
        elif len(authors) == 2:
            authors_str = authors[0] + ' and ' + authors[1]
        else:
            authors_str = authors[0] if authors else ''
            
        # Build citation
        citation = f"{authors_str}. {title}"  # Note: Title should be italicized in actual display
        if publisher:
            citation += f". {publisher}"
        if year:
            citation += f", {year}"
        citation += "."
        
        return citation

def format_journal_citation(data, style):
    title = data.get('title', '')
    authors = data.get('authors', [])
    journal = data.get('journal', '')
    volume = data.get('volume', '')
    issue = data.get('issue', '')
    year = data.get('year', '')
    pages = data.get('pages', '')
    doi = data.get('doi', '')

    if style == 'APA':
        # Format authors
        if not authors:
            authors_str = "No author"
        elif len(authors) == 1:
            authors_str = authors[0]
        elif len(authors) == 2:
            authors_str = f"{authors[0]} & {authors[1]}"
        else:
            authors_str = ", ".join(authors[:-1]) + f", & {authors[-1]}"

        citation = f"{authors_str}. ({year}). {title}. {journal}"
        if volume:
            citation += f", {volume}"
            if issue:
                citation += f"({issue})"
        if pages:
            citation += f", {pages}"
        if doi:
            citation += f". https://doi.org/{doi}"
        citation += "."
        return citation

    elif style == 'MLA':
        # Format authors
        if not authors:
            authors_str = "No author"
        elif len(authors) == 1:
            authors_str = authors[0]
        elif len(authors) == 2:
            authors_str = f"{authors[0]} and {authors[1]}"
        else:
            authors_str = ", ".join(authors[:-1]) + f", and {authors[-1]}"

        citation = f'{authors_str}. "{title}." {journal}'
        if volume and issue:
            citation += f", vol. {volume}, no. {issue}"
        elif volume:
            citation += f", vol. {volume}"
        if year:
            citation += f", {year}"
        if pages:
            citation += f", pp. {pages}"
        if doi:
            citation += f", https://doi.org/{doi}"
        citation += "."
        return citation

    return "Citation style not supported"

if __name__ == '__main__':
    app.run(debug=True)
